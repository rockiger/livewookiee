/* This module deals with entering a task via a special entry field */
"use strict";
var assert = require("assert");
var util = require("./util");
var htmlUtil = require("./htmlUtil");

var DURATION = 50;

/*
* ==========
* Globals:
*/
var util = require('./util');
var findTask = require('./findTask');
var u = require('util');
var $;
var ES;
var ED;
var NLC;
var shownTaskState;
var deepEqual = assert.deepEqual;
var reloadTasks;
var reloadEditor;

/*
 * =========
 * Constants:
 */

var ALL = "ALL";

/* Function(jquery) Object Object -> Task
 * Consumes jquery-object, editor-session, the document and toggles the entry task field
 */
function toggleTaskEntry(jquery, editorSession, editor, currentTaskState, showTask, showEditor) {
    $ = jquery;
    if ($("#show-enterTask").hasClass("active")) {
        cancelTaskEntry(jquery);
    } else if ($("#show-editor").hasClass("active")) {
       return "";
    } else {
        if($("#show-searchbox").hasClass("active")) {
            findTask.cancelSearchBox(jquery);
        }
        openTaskEntry(jquery, editorSession, editor, currentTaskState, showTask, showEditor);
    }
}

/* Function(jquery) Object Object -> Task
 * Consumes jquery-object, editor-session, the document and opens up an entry field to insert a new task, produces the task
 */
function openTaskEntry(jquery, editorSession, editor, currentTaskState, showTask, showEditor) {
    $ = jquery;
    ES = editorSession;
    ED = editor;
    NLC = ES.getDocument().getNewLineCharacter();
    shownTaskState = currentTaskState;
    reloadTasks = showTask;
    reloadEditor = showEditor;
    var content = ES.getValue();
    var projects = util.getProjects(util.getNodes(content));
    var enterTaskDiv = $('#enterTaskDiv');
    var enterTask = $('#enterTask');
    var enterTaskProject = $('#enterTaskProject');
    var enterHeadline = $('#enterHeadline');
    var enterDate = $('#enterDate');
    var enterTaskButton = $('#show-enterTask');

    enterTaskProject.html("<option>Inbox</option>\n" + buildOptions(projects));
    enterTask.submit(submitTask);
    $('#list').animate({ top: "107px" }, DURATION);
    enterTaskDiv.slideDown(DURATION);
    enterHeadline.focus();
    enterTaskButton.addClass("active");
}

/* ListOfNodes -> String
 * Consumes a list of nodes and produces a option list
 */
function buildOptions(lon) {
    if (lon.length === 0) {
        return "";
    } else {
        return "<option>" + lon[0].headline + "</option>\n" + buildOptions(lon.slice(1));
    }
}

/* Function(jquery) Object -> Task
 * Consumes jquery and closes the entry form and deletes the input
 */
function cancelTaskEntry($) {
    var enterTaskDiv = $('#enterTaskDiv');
    var enterTask = $('#enterTask');
    var enterHeadline = $('#enterHeadline');
    var enterTaskButton = $('#show-enterTask');

    enterHeadline.val("");
    enterTaskDiv.slideUp(DURATION);
    $('#list').animate({ top: "52px" }, DURATION);
    enterTaskButton.removeClass("active");
}

/* Form -> Void
 * consumes the form and is reponsible for the handling of a submited task
 */
function submitTask(e) {

    var taskProject = $(this).find('#enterTaskProject').val();
    var taskHeadline = $(this).find('#enterHeadline').val();
    var taskStatus = $(this).find('#enterTaskStatus').val();

    if (taskHeadline !== '') {
        var project = findProject(taskProject);
        var endOfProject = findEndOfProject(project);
        var taskRank = rankOfNewTask(ED.getSession().getValue());
        writeTask(endOfProject, taskStatus, taskHeadline, taskRank);
        //addTaskToList(taskStatus, taskHeadline, taskProject, taskDate);
    }

    // TODO: Refactor to function
    var emptyListImage = $(".empty-list-image").contents();
    if (emptyListImage !== []) {
		var state = $("#taskbuttons .active").text().toUpperCase();
                if (state.length === 0) {
                    state = $("#show-all.active").text().toUpperCase();
                    if (state.length !== 0) {
                        reloadTasks(ALL);
                        cancelTaskEntry($);
                        return false;
                    } else {
                        state =  $("#show-editor.active").text().toUpperCase();
                        if (state.length !== 0) {
                            reloadEditor();
                            cancelTaskEntry($);
                            return false;
                        }
                    }
                }
		reloadTasks(state);
	}


    cancelTaskEntry($);
    return false; //prevent form from redirect.
}

/* String -> Range
 * Consumes a projectname and produces the position of that project
 */
function findProject(project) {
    // find range
    var result = ED.find("# " + project, {wrap:true, range: null}, false);
    if (result === undefined && project === "Inbox") {
        return createInbox();
    } else {
        return result;
    }
}

/* Void -> Range
 * Creates a Inbox in taskfile and producese the range of that Inbox
 */
function createInbox() {
    var pos = getFileEndPosition();
    ES.insert(pos, NLC + "# Inbox");
    return findProject("Inbox");
}

/* Range -> Position
 * consumes the range of the project headline and produces the position of end of the project
 */
function findEndOfProject(startRange) {
    var position;
    var doc = ES.getDocument();
    var result = ED.find(NLC + "# ", {wrap:false, range: null, start: startRange, skipCurrent: false}, false);
    if (result === undefined) {
        position = getFileEndPosition();
        ES.insert(position, NLC);
        return getFileEndPosition();
    }
    position = result.end;
    position.column = 0
    return position;
}

/* Void -> Position
 * Produces the position of the end of the file
 */
function getFileEndPosition() {
    ED.navigateFileEnd();
    return ED.getCursorPosition();
}

/* Position, String String -> Void
 * Consumes position, status and headline of a new task and produces an entry in the editor
 */
 function writeTask(pos, status, headline, rank, deadline) {
    ES.insert(pos, "## " + status + " " + headline + "\nRANK: " + rank);
    var currentPos = ED.getCursorPosition();
    var endOfFile = getFileEndPosition();
    if (JSON.stringify(currentPos) === JSON.stringify(endOfFile)) {
        return;
    } else {
        currentPos.column = currentPos.column - 2;
        ES.insert(currentPos, NLC);
    }
 }

 /* TaskState String -> Void
  * Consumes Taskstate and adds the task to the current task list if the state matches the curren shown task state
  */
 function addTaskToList(taskState, headline, project, deadline) {
    if (taskState === shownTaskState) {
        $("#list").append(htmlUtil.htmlForTodoListRow(taskState, headline,
                          deadline, project));
    }
 }

 /* String -> Rank
  * Returns the rank for a new task, which is +1 of the highest rank in the content
  */
 deepEqual(rankOfNewTask(""), 1);
 deepEqual(rankOfNewTask("## Task 1\nRANK: 1\n## Task 2\nRANK: 2"), 3);
 deepEqual(rankOfNewTask("## Task 1\nRANK: 1\n## Task 2\nRANK: 10"), 11);
 function rankOfNewTask(content) {
    var todos = util.orderNodesByRank(util.getNodes(content));
    var ranks = todos.map(function(e) {
        if (e.rank !== null) {
            return e.rank
        } else {
            return e.rank;
            }});
    return Math.max.apply(Math,ranks) + 1;
 }

exports.openTaskEntry = openTaskEntry;
exports.cancelTaskEntry = cancelTaskEntry;
exports.newRank = rankOfNewTask;
exports.toggleTaskEntry = toggleTaskEntry;
