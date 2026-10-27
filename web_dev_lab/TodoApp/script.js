// Variables
const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");


// Add Todo function
function addTodo(){
    if(inputBox.value == ''){
        alert("Empty fields aren't permitted") // Input with no value
    }else{
        let li = document.createElement("li"); // Creating new HTML element with the tag li
        li.innerHTML = inputBox.value; // Storing the value of inputBox inside li element
        listContainer.appendChild(li); // Adding the li element to the list container

        // Adding a new html element to delete a todo
        let span = document.createElement("span");
        span.innerHTML = "\u00d7"
        li.appendChild(span);
    }
    // Clearing input box after saving todo
    inputBox.value = '';
    saveData();
    }


    listContainer.addEventListener("click", function(e){
        if(e.target.tagName === "LI"){  
            e.target.classList.toggle("checked"); // Toggle between checked and not checked
            saveData();
        }else if(e.target.tagName === "SPAN"){
            e.target.parentElement.remove();  // Delete the todo
            saveData();
        }
    }, false);


    // Function to save data when refreshing html page or closing the browser
    function saveData(){
        localStorage.setItem("data", listContainer.innerHTML);
    }

    
    // Display Data
    function showTask(){
        listContainer.innerHTML = localStorage.getItem("data");
    }

showTask();



