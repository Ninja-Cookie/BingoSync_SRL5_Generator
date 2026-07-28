const reader        = new FileReader();
const difficulties  = "#difficulties";
const difficulty    = "#difficulty";
const types         = "#types";
const container     = "#goalContainer"
const goalID        = "#goal"

var options = [""];

function FillDifficulties()
{
    for (i = 1; i < 25; i++)
    {
        const clone = document.querySelector(difficulties + ">" + difficulty).cloneNode(true);
        const difficultiesElement = document.querySelector(difficulties);
        difficultiesElement.lastElementChild.after(clone);
        difficultiesElement.lastElementChild.firstElementChild.innerHTML += " " + String((i + 1)).padStart(2, '0') + " (0)";

        if (i == 24)
        {
            const firstDifficultiesElement = document.querySelector(difficulties + ">" + difficulty).firstElementChild;
            firstDifficultiesElement.innerHTML += " " + String(1).padStart(2, '0');
            UpdateSummaryName(firstDifficultiesElement);
        }

        UpdateSummaryName(difficultiesElement.lastElementChild.firstElementChild);
    }
}

function AddOptionPrompt()
{
    AddOption(document.querySelector("#typeInput")?.value?.trim());
}

function AddOption(option)
{
    if (option != null && String(option) != "" && !options.includes(String(option)))
    {
        options.push(String(option));
        UpdateOptions();
    }
}

function RemoveOptionPrompt()
{
    RemoveOption(document.querySelector("#typeInput")?.value?.trim());
}

function RemoveOption(option)
{
    if (options.includes(String(option)))
    {
        options.splice(options.indexOf(String(option)), 1);
        if (options.length <= 0)
            AddOption("");
        else
            UpdateOptions();
    }
}

function UpdateOptions()
{
    document.querySelectorAll(types).forEach(element =>
    {
        let currentOptions = element.options;
        let selectedOption = element.selectedIndex >= 0 ? element[element.selectedIndex].innerHTML : null;

        for (i = currentOptions.length - 1; i >= 0; i--)
        {
            if (currentOptions[i].localName == "option")
                currentOptions[i].remove();
        }

        options.forEach(option =>
        {
            var opt         = document.createElement('option');
            opt.value       = i;
            opt.innerHTML   = String(option);
            element.appendChild(opt);
        });

        if (selectedOption != null && options.includes(String(selectedOption)))
            element.selectedIndex = options.indexOf(String(selectedOption));
        else if (options.length > 0)
            element.selectedIndex = 0;
    });
}

function AddGoal(section)
{
    const clone = document.importNode(document.querySelector("#template_goal").content, true);
    section.parentElement.parentElement.insertBefore(clone, section.parentElement);
    UpdateSummaryName(section.parentElement.parentElement.querySelector("summary"));
    return section.parentElement.previousElementSibling;
}

function UpdateSummaryName(summaryElement)
{
    const newSize = summaryElement.parentElement.querySelectorAll(goalID).length;
    summaryElement.innerHTML = summaryElement.innerHTML.split("(")[0].trim() + " (" + String((newSize)).padStart(2, '0') + ") ";
}

function AddGoalType(section)
{
    const clone = document.importNode(document.querySelector("#template_types").content, true);
    section.parentElement.insertBefore(clone, section);
    UpdateOptions();
    return section.previousElementSibling;
}

function RemoveGoal(section)
{
    const summaryElement = section.parentElement.parentElement.parentElement.querySelector("summary");
    section.parentElement.parentElement.remove();
    UpdateSummaryName(summaryElement);
}

function RemoveGoalType(goalType)
{
    goalType.parentElement.remove();
}

function ImportFile()
{
    document.querySelector("#importFile").click();
}

function InitReader()
{
    reader.onload   = () => { ParseJSON(reader.result); };
    reader.onerror  = () => { showMessage("Error reading the file. Please try again.", "error"); };
}

function InitImport()
{
    const importFile = document.querySelector("#importFile");
    importFile.addEventListener("cancel", () => { console.log("Cancelled."); });
    importFile.addEventListener("change", () =>
    {
        if (importFile.files.length === 1)
        {
            const file = importFile.files[0];
            console.log("File selected: ", file);
            reader.readAsText(file);
        }
    });
}

function Init()
{
    InitReader();
    InitImport();
    FillDifficulties();
    UpdateOptions();
}

function ClearAllGoals()
{
    const allDifficulties = document.querySelectorAll(difficulty);
    allDifficulties.forEach(dif =>
    {
        const goalContainers = dif.querySelectorAll(container);
        for (var i = goalContainers.length - 1; i >= 0; i--)
        {
            goalContainers[i].remove();
        }

        UpdateSummaryName(dif.querySelector("summary"));
    });

    options = [""];
}

function ParseJSON(json)
{
    const difficultyEntries = [];
    try
    {
        const srl = JSON.parse(json);
        if (!Array.isArray(srl) || srl.length !== 25 || !Array.from(srl).every(entry => Array.isArray(entry)))
        {
            if (!Array.isArray(srl))
                alert("JSON file was invalid...");
            else if (srl.length !== 25)
                alert("JSON expected 25 difficulty entires but got " + srl.length);
            else
                alert("Not every entry from the JSON was a valid Array");

            return;
        }

        srl.forEach(entry => difficultyEntries.push(entry));
    }
    catch (error)
    {
        console.log(error);
        return;
    }

    PopulateGoals(difficultyEntries);
}

function PopulateGoals(difficultyEntries)
{
    if (difficultyEntries.length !== 25)
        return;

    ClearAllGoals();

    const allDifficulties = document.querySelectorAll(difficulty);
    for (let i = 0; i < allDifficulties.length; i++)
    {
        difficultyEntries[i].forEach(goal =>
        {
            const goalField = AddGoal(allDifficulties[i].querySelector("#addGoal"));
            goalField.querySelector("#goal").value = goal.name?.trim();

            if (Array.isArray(goal.types))
            {
                goal.types.forEach(type =>
                {
                    const typeOption = String(type.trim());
                    AddOption(typeOption);
                    if (options.includes(typeOption))
                    {
                        const index = options.indexOf(typeOption);

                        const typeField = AddGoalType(goalField.querySelector("#addGoalType"));
                        typeField.querySelector("#types").selectedIndex = index;
                    }
                    else
                    {
                        console.log("Type " + "\"" + typeOption + "\"" + " was invalid from JSON...");
                    }
                });
            }
        });
    }
}

function SaveFile(content)
{
    const link = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });

    link.href       = URL.createObjectURL(file);
    link.download   = "bingosync_srl5_game.txt";
    link.click();

    URL.revokeObjectURL(link.href);
}

function SaveToJSON()
{
    const allDifficulties = document.querySelectorAll(difficulty);
    const difficultySections = [];

    allDifficulties.forEach(dif =>
    {
        const goals = [];
        const goalContainers = dif.querySelectorAll(container);
        goalContainers.forEach(goalContainer =>
        {
            const goalName = goalContainer.querySelector(goalID)?.value?.trim() ?? "";

            const typeList = [];
            const typeContainers = goalContainer.querySelectorAll("#types");
            if (typeContainers.length > 0)
            {
                typeContainers.forEach(t => {if (options[t.selectedIndex] != 0) typeList.push(options[t.selectedIndex])});
            }

            const finalEntry = typeList.length > 0 ? {name: goalName, types: typeList} : {name: goalName};
            goals.push(finalEntry);
        });
        
        if (goals.length === 0)
            goals.push({name: "[empty]"});

        difficultySections.push(goals);
    });

    const finalJSON = JSON.stringify(difficultySections);
    SaveFile(finalJSON);
}

function ToggleAllDetails()
{
    const difs = document.querySelectorAll(difficulty);
    const value = !Array.from(difs).some(tab => tab.open);
    document.querySelectorAll(difficulty).forEach(dif => dif.open = value);
}

Init();