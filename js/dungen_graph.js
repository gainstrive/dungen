
DG.isMap = false;

DG.data= {
  historicalNames: false,
  settlements: [],
  organizations: [],
  monster_relations: [],
  wandering_monsters: [],
  notes: '',
  nodes: [],
    edges: [],
    monsterTags: [],
    monsters: {},
  nodeTags: [],
    edgeTags: [],
    nodeTable: [],
    edgeTable: [],
    style: {
    border: 'gray',
      borderWidth: 1,
      borderRadius: 6,
      highlightBorder: 'black',
      fontSize: 14,
      fontFace: "arial",
      fontColor: "black",
      shape: "box",
      size: 20,
      bgColor: "lightgray",
      highlightBgColor: "lightgray",
      edges: {width: 1, color: {color: 'gray'}}
  }

};

DG.defaultStyle = {
  border: 'gray',
    borderWidth: 1,
    borderRadius: 6,
    highlightBorder: 'black',
    fontSize: 14,
    fontFace: "arial",
    fontColor: "black",
  shape: "box",
    size: 20,
    bgColor: "lightgray",
    highlightBgColor: "lightgray",
    edges: {width: 1, color: {color: 'gray'}}
};

// Dungeon Key table -------------------------------------------------
DG.fillKey = function () {
  //This function will render out the labels and descriptions from
  //DG.data.nodes into table#dungeon_key
  var dungeonKey = "<thead>\n<tr><th>Location</th><th>Description (click in a cell to edit)</th></tr>\n</thead><tbody>"
  var tln = "<tr class='node_row' id ='";
  var tle = "<tr  class='edge_row'id ='";
  var tlm = "'><td class='dungen'>";
  var tm = "</td><td class='dungen dg_description'>";
  var tr = "</td></tr>";
  var node = {};
  var nodesLength = DG.data.nodes.length;
  var edge = {};
  var edgesLength = DG.data.edges.length;
  var fromNodeLabel, toNodeLabel;
  for (i = 0; i < nodesLength; i += 1) {
    node = DG.data.nodes[i];
    dungeonKey = dungeonKey + ( tln + node["id"] + tlm + node["label"] + tm + node["title"] + tr );
  }
  dungeonKey += "\n</tbody>";
  dungeonKey += "\n<tbody>";
  for (i = 0; i < edgesLength; i += 1) {
    edge = DG.data.edges[i];
    fromNodeLabel = DG.findInArrayById(edge["from"], DG.data.nodes)["label"];
    toNodeLabel = DG.findInArrayById(edge["to"], DG.data.nodes)["label"];
    dungeonKey = dungeonKey + ( tle + edge["id"] + tlm + edge["label"] + tm + fromNodeLabel + " to " + toNodeLabel + tr );
  }
  dungeonKey += "\n</tbody>";
  document.getElementById("dungeon_key").innerHTML = dungeonKey;
};

DG.findInArrayById = function (id, arrayToSearch) {
  return $.grep(arrayToSearch, function (e) {
    return e.id == id;
  })[0];
};
// Dig a dungeon ---------------------------------------------------------
DG.digDungeon = function (locationType) {
  var data = {nodes: null, edges: null};
  var levelSelect = document.getElementById("level");
  var sizeSelect = document.getElementById("size");
  var patternSelect = document.getElementById("pattern");
  var selectedSize = "5,5";
  var dungeonLevelSelected = levelSelect.options[levelSelect.selectedIndex].value;
  var selectedPattern = patternSelect.options[patternSelect.selectedIndex].value;
  DG.nameTheDungeon();
  DG.data.nodes = [];
  DG.data.edges = [];
  DG.data.organizations = [];
  DG.data.settlements = [];
  DG.data.monsters = {};
  DG.monsterHold = undefined;
  DG.data.locationType = locationType;
  DG.data.treasureMultiplier = parseFloat($("#treasureMultiplier").val()) || 1;
  DG.roomCount = 0;
  DG.edgeCount = 0;
  if (dungeonLevelSelected === "wilds") {
    DG.data.dungeonLevel = dungeonLevelSelected
  } else {
    DG.data.dungeonLevel = parseInt(dungeonLevelSelected);
  }
  selectedSize = sizeSelect.options[sizeSelect.selectedIndex].value;
  DG.minRooms = parseInt(selectedSize.split(",")[0]);
  DG.maxRooms = parseInt(selectedSize.split(",")[1]);
  DG.setRandomRoomCount();
  DG.makeRooms();
  switch (selectedPattern) {
    case "branch":
      DG.linkStrats.branchLink(DG.allNodeIds());
      break;
    case "branch_loops":
      DG.linkStrats.branchLink(DG.allNodeIds());
      DG.linkStrats.randomLink(Math.floor(DG.roomCount / 5) + 1);
      break;
    case "triangles":
      DG.linkStrats.trianglesLink(DG.allNodeIds());
      DG.linkStrats.randomLink(Math.floor(DG.roomCount / 6) + 1);
      break;
    case "grid":
      DG.linkStrats.gridLink();
      break;
    case "random":
      DG.linkStrats.randomAllLink(Math.floor(DG.roomCount) + 2);
      break;
    case "mixed":

      break;
    default:
  }
  DG.initNetwork();
  DG.data.notes = DG.populateNotes();
  DG.ui.populateNotesFields();
};
// Nodes and Linkage ------------------------------------------------------------------------

DG.makeRooms = function () {
  DG.setBaseMonsters();
  for (var i = 0; i < DG.roomCount; i += 1) {
    DG.data.nodes[i] = DG.makeNode(i, DG.nameNode(i + 1));
  }
};

DG.makeEdge = function (startNode, endNode) {
  if (startNode === undefined) {
    return "error"
  }

  if (endNode === undefined) {
    return "error"
  }

  return {
    from: startNode,
    to: endNode,
    label: this.randomEdgeLabel(),
    width: DG.data.style.edges.width,
    font: {face: DG.data.style.fontFace, size: DG.data.style.fontSize}
  };
};

DG.linksOnNode = function (nodeId) {
  return edges = DG.data.edges.filter(function (edge) {
    return (edge.from === nodeId || edge.to === nodeId);
  });
};

DG.linkNodes = function (startEdge, endEdge) {
  var edge = DG.makeEdge(startEdge, endEdge);
  if (edge === "error") {
    console.log("attempting to link undefined node");
    return
  }
  DG.data.edges.push(DG.makeEdge(startEdge, endEdge));
};

DG.makeNode = function (id, label) {
  var border = DG.data.style.border,
    borderWidth = DG.data.style.borderWidth,
    borderRadius = DG.data.style.borderRadius,
    borderWidthSelected = borderWidth * 1.2,
    bgColor = DG.data.style.bgColor,
    shape = DG.data.style.shape,
    size = DG.data.style.size,
    fontSize = DG.data.style.fontSize,
    fontFace = DG.data.style.fontFace,
    fontColor = DG.data.style.fontColor,
    highlightBgColor = DG.data.style.highlightBgColor,
    highLightBorder = DG.data.style.highlightBorder;

  var contents = DG.makeContents(DG.data.dungeonLevel);

  DG.addMonstersToList();
  return {
    id: id,
    shape: shape,
    size: size,
    font: {size: fontSize, face: fontFace, color: fontColor},
    borderWidth: borderWidth,
    borderWidthSelected: borderWidthSelected,
    shapeProperties: {borderRadius: borderRadius},
    color: {
      background: bgColor,
      border: border,
      highlight: {
        background: highlightBgColor,
        border: highLightBorder
      }
    },
    label: label,
    title: contents,
    group: ""
  };
};

DG.allNodeIds = function () {
  var nodeIds = [];
  DG.data.nodes.forEach(function (node) {
    nodeIds.push(node.id);
  });
  return nodeIds;
};

DG.drawOptions = {
  physics: {
    enabled: true,
      forceAtlas2Based: {}
  },
  configure: {enabled: false},
  manipulation: {
    enabled: true,
      initiallyActive: false,
      addNode: function (data, callback) {
      /** data = {id: random unique id,
            *           label: new,
            *           x: x position of click (canvas space),
            *           y: y position of click (canvas space),
            *           allowedToMoveX: true,
            *           allowedToMoveY: true
            *          };
       */
      var i = DG.data.nodes[DG.data.nodes.length - 1].id + 1;

      var newData = DG.makeNode(i, DG.nameNode(i + 1));
      // alter the data as you want.
      // all fields normally accepted by a node can be used.
      DG.nodesDataSet.add(newData);

      callback(newData);  // call the callback to add a node.
    },
    editNode: function (data, callback) {
      /** data = {id:...,
            *           label: ...,
            *           group: ...,
            *           shape: ...,
            *           color: {
            *             background:...,
            *             border:...,
            *             highlight: {
            *               background:...,
            *               border:...
            *             }
            *           }
            *          };
       */

      var newData = data; // alter the data as you want.
                          // all fields normally accepted by a node can be used.
      DG.nodeDialog(newData, callback);
    },
    editEdge: function (data, callback) {
      /** data = {id: edgeID,
            *           from: nodeId1,
            *           to: nodeId2,
            *          };
       */

      var newData = data; // alter the data as you want, except for the ID.
                          // all fields normally accepted by an edge can be used.a

      var currentEdgeColor;

      if (typeof (newData.color === 'undefined')) {
        newData.color = DG.data.style.edges.color;
      }
      currentEdgeColor = newData.color.color;

      var edgeColorOptions = DG.view.buildOptions(DG.view.solidColorList, currentEdgeColor);

      bootbox.dialog({
        title: "Edit Path between Locations",
        message: DG.view.rowDiv(
          DG.view.colDiv(
            DG.view.blankForm(
              DG.view.formGroupDiv(
                DG.view.label4('name', 'Name') +
                DG.view.inputTag("edge_name", "Path name", DG.edgesDataSet.get(newData.id).label)
              ) +
              DG.view.controlDiv('Color ', DG.view.selectControl("edgeColor", edgeColorOptions), "6")
            ), 12)),
        buttons: {
          save: {
            label: "Save",
            className: "btn-success",
            callback: function () {
              newData.label = $('#edge_name').val();
              newData.color.color = $("select#edgeColor option:selected").text();
              DG.edgesDataSet.update(newData);
              callback(newData);

            }
          }

        }


      })

    },
    addEdge: function (data, callback) {
      // data = {from: nodeId1, to: nodeId2};
      var newData = {};
      for (var attrname in data) {
        newData[attrname] = data[attrname];
      }
      newData.label = DG.randomEdgeLabel();

      DG.edgesDataSet.add(newData);
      // check or alter data as you see fit.
      callback(newData);       // call the callback to connect the nodes.
    },
    deleteNode: function (data, callback) {
      //   data = {nodes: [selectedNodeIds], edges: [selectedEdgeIds]};
      var newData = data; // alter the data as you want.
      //  the same data structure is required.
      // WILL NEED TO REMOVE THEM FROM THE LISTS IN DG.data
      DG.edgesDataSet.remove(newData.edges);
      DG.nodesDataSet.remove(newData.nodes);
      DG.fillKey();
      callback(newData);  // call the callback to delete the objects.
    },
    deleteEdge: function (data, callback) {
      // duping deleteNode in translation from 3.6 to 4.4 for now, probably needs revision
      //   data = {nodes: [selectedNodeIds], edges: [selectedEdgeIds]};
      var newData = data; // alter the data as you want.
      //  the same data structure is required.
      // WILL NEED TO REMOVE THEM FROM THE LISTS IN DG.data
      DG.edgesDataSet.remove(newData.edges);
      DG.fillKey();
      callback(newData);  // call the callback to delete the objects.
    }
  }
};

DG.initNetwork = function () {
  var data;
  DG.nodesDataSet = new vis.DataSet(DG.data.nodes);
  DG.nodesDataSet.on('*', function (event, properties, senderId) {
    DG.data.nodes = DG.nodesDataSet.get();
    DG.data.edges = DG.edgesDataSet.get();
    DG.fillKey();
  });
  DG.edgesDataSet = new vis.DataSet(DG.data.edges);
  DG.edgesDataSet.on('*', function (event, properties, senderId) {
    DG.data.edges = DG.edgesDataSet.get();
    DG.fillKey();
  });
  data = {nodes: DG.nodesDataSet, edges: DG.edgesDataSet};
  DG.network = new vis.Network(DG.container, data, DG.drawOptions);

  DG.fillKey();
};

DG.nameNode = function (nodeNum) {
  return "" + (nodeNum) + ": " + DG.randomNodeLabel()
};

DG.randomNodeLabel = function () {
  var nodeLabel;
  if (DG.data.locationType == "wilds") {
    return this.drawOne(this.wild.nodeLabels);
  }
  else {
    if (DG.data.nodeTable === undefined) {
      return DG.drawOne(DG.stock.nodeLabels).label;
    }
    if (DG.data.nodeTable.length > 0) {
      return DG.drawOne(DG.data.nodeTable).label;
    }
    return DG.drawOne(DG.stock.nodeLabels).label;
  }
};

DG.randomEdgeLabel = function () {
  if (DG.data.locationType == "wilds") {
    return this.drawOne(this.wild.edgeLabels);
  }
  else {
    if (DG.data.edgeTable === undefined) {
      return DG.drawOne(DG.stock.edgeLabels).label;
    }
    if (DG.data.edgeTable.length > 0) {
      return DG.drawOne(DG.data.edgeTable).label;
    }
    return DG.drawOne(DG.stock.edgeLabels).label;
  }
};
