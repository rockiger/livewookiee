var org = require('../lib/markdown-org-mode-parser');

var process = require("process");
var fs = require("fs");
var path = require("path");
var assert = require("assert");

var deepEqual = assert.deepEqual;

function getTaskFiles() {
    var userHome = getUserHome();
    console.log(userHome);
    return getLiveflow(userHome);
}

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function getLiveflow(userHome) {
    var confFolder = path.join(userHome + "/.akiee/");
    var filename = "liveflow.md";
    var filepath = path.join(userHome + "/.akiee/" + filename);
    console.log(confFolder);
    var liveFlowPath = path.join(confFolder, filename);
    if (fs.existsSync(confFolder)) {
        if (fs.existsSync(liveFlowPath)) {
            return liveFlowPath;
        } else {
            fs.writeFileSync(filepath, "");
        }
    } else {
        fs.mkdirSync(confFolder);
        fs.writeFileSync(filepath, "");
    }
    return liveFlowPath;
}


/* Editor String -> Bool
 * consumes an editor and a filepath and loads the file in editor,
 * produces the content of the file or false if file could not be loaded
 */

function openFile(editor, filePath) {
  if (fs.existsSync(filePath)) {
	hasChanged = false;
	var fileContent = fs.readFileSync(filePath, "utf8");
	editor.getSession().setValue(fileContent);
	currentFile = filePath;
	return fileContent;
  }
  else {
	return false;
  }
}

function print_r(obj) { 
	for (var e in obj) {
        console.log(e);
    }
}

    /**
     * String -> ListOfNodes
     * Produces a list of nodes with in a string with markdown content md
     */
    deepEqual("","", "getNodes");
    function getNodes(md) {
        var nodes = org.parseBigString(md);
	//for (var i = 0; i < nodes.length; i++) {
	//    if (nodes[i].rank) {
	//	console.log(nodes[i]);
	//    }
	//}
        return nodes;
    }
    
    /**
     * ListOfNodes -> ListOfNodes
     * Consumes a list of nodes and produces a ListOfNodes that are first order headlines
     * filters the "Inbox" project
     */
    function getProjects(lon) {
	if (lon.length === 0) {
            return [];  
        }
	else if (lon[0].headline === "Inbox") {
	    return getProjects(lon.slice(1));
	} else {
	    if (lon[0].todo === null && lon[0].level === 1) {
	        return [lon[0]].concat(getProjects(lon.slice(1)));
	    } else {
		return getProjects(lon.slice(1));
	    }
        }
    }
    
    /**
     * ListOfNodes -> ListOfNodes
     * Produces a ascending ordered list of nodes by RANK,
     * non ranked nodes, are put at the end of the list
     */
    var n1 = {"headline": "Test-Node 1", "rank": 0}
    var n2 = {"headline": "Test-Node 2", "rank": 5}
    var n3 = {"headline": "Test-Node 3", "rank": 11}
    var n4 = {"headline": "Test-Node 11", "rank": null}
    
    
    deepEqual(orderNodesByRank([n1, n2, n3]),
	      [n1, n2, n3], "orderNodesByRank: line 103");
    deepEqual(orderNodesByRank([n2, n1, n3]),
	      [n1, n2, n3], "orderNodesByRank: line 105");
    deepEqual(orderNodesByRank([n3, n2, n1]),
	      [n1, n2, n3], "orderNodesByRank: line 107");
    deepEqual(orderNodesByRank([n3, n2, n1, n3]),
	      [n1, n2, n3, n3], "orderNodesByRank: line 109");
    deepEqual(orderNodesByRank([n3, n2, n4, n1]),
	      [n1, n2, n3, n4], "orderNodesByRank: line 109");
    deepEqual(orderNodesByRank([]),
	      [], "orderNodesByRank: line 111");
    
    function orderNodesByRank(lon) {
	return lon.sort(hasHigherRank);
    }
    
    
    /**
     * Node Node -> Bool
     * Determens if n2 has a higher Rank than n1
     */
    deepEqual(hasHigherRank(n1, n2), -1);
    deepEqual(hasHigherRank(n2, n1), 1);
    deepEqual(hasHigherRank(n1, n3), -1);
    deepEqual(hasHigherRank(n3, n1), 1);
    deepEqual(hasHigherRank(n1, n1), 1);
    deepEqual(hasHigherRank(n3, n3), 1);
    
function hasHigherRank(n1, n2) {
	if (n1.rank === null) {
	    return 1;
	} else if (n1.rank !== null && n2.rank === null) {
	    return -1;
	} else if (parseInt(n1.rank, 10) < parseInt(n2.rank, 10)) {
	    return -1;
	} else {
	    return 1;
	}
}

exports.getTaskFiles = getTaskFiles;
exports.getUserHome = getUserHome;
exports.getLiveflow = getLiveflow;
exports.print_r = print_r;
exports.getNodes = getNodes;
exports.getProjects = getProjects;
exports.orderNodesByRank = orderNodesByRank;
exports.hasHigherRank = hasHigherRank;
exports.openFile = openFile