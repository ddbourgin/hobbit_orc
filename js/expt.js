// IMPORTANT: CHANGE THIS BEFORE GOING INTO PRODUCTION!!
var DEBUG = true;
var ipAddress;
var workerId = Math.round(Math.random() * 1000);
if (DEBUG) {
    var assignmentId = 'DEBUG';
    ipAddress = Math.floor(Math.random() * 257) + "." +
                Math.floor(Math.random() * 257) + "." +
                Math.floor(Math.random() * 257) + "." +
                Math.floor(Math.random() * 257);
}

imObH = new Image();
imObH.src = 'images/hobbit.jpeg';
imObH.onload = function () {};

imObO = new Image();
imObO.src = 'images/orc.png';
imObO.onload = function () {};



var success = 0; // if subject solved the problem
var maxSteps = 100; // should really get this from db
var experimentCompleted = 0; // if subject reached the end (regardless of whether they solved the problem)
var stepsRemaining = maxSteps;

var lineWidth = "4"; // pixels
var canvasWidth = 800;
var canvasHeight = 400;
var borderHeight = 20;
var borderWidth = 20;
var boatHeight = 50;
var boatWidth = 100;
var bankBoatBuffer = 3;
var imgImgBuffer = 10;
var boatImgBuffer = 5;

var hobbitCanvas = $('<canvas id="hobbit-canvas" width="' + canvasWidth + '" height="' + canvasHeight + ' style="border:1px solid #d3d3d3;">Your browser does not support the HTML5 canvas tag.</canvas>');

var bankWidth = Math.floor((canvasWidth - 2 * borderWidth) / 4);
var oceanWidth = bankWidth * 2;
var bankHeight = Math.floor(canvasHeight - 2 * borderHeight);

var leftBank = {
    xloc: borderWidth,
    yloc: borderHeight,
    width: bankWidth,
    height: bankHeight
};

var rightBank = {
    xloc: canvasWidth - borderWidth - bankWidth,
    yloc: borderHeight,
    width: bankWidth,
    height: bankHeight
};

var boat = {
    yloc: borderHeight + Math.floor(bankHeight / 2) + Math.floor(boatHeight / 2),
    xloc_left: borderWidth + bankWidth + bankBoatBuffer,
    xloc_right: canvasWidth - borderWidth - bankWidth - bankBoatBuffer - boatWidth,
    width: boatWidth,
    height: boatHeight
};


var prob, cond, imgArray;
cond = [3,3,2];

//remove the subject from the database in case he or she navigates away
$(window).bind('beforeunload', function() {
    endExperiment();
});

function initProblem() {
    // cond is a tuple of (totalHobbits, totalOrcs, boatCapacity)
    var total = cond[1] + cond[0];
    var buffer = (total - 1) * imgImgBuffer;
    var imgHeight = Math.floor((rightBank.height - 2 * borderHeight - buffer) / total);
    var ylocs = [];

    var boatXLocs_L = [];
    var boatXLocs_R = [];

    for (i=0; i < total+1; i++) {
        ylocs.push(leftBank.yloc + borderHeight + i * (imgHeight + imgImgBuffer) );
    }

    leftBank.picYLocs = ylocs;
    leftBank.picXLoc = ((leftBank.width - imgHeight) / 2) + leftBank.xloc;

    rightBank.picYLocs = ylocs;
    rightBank.picXLoc = ((rightBank.width - imgHeight) / 2) + rightBank.xloc;

    boat.capacity = cond[2];
    buffer = (boat.capacity - 1) * boatImgBuffer;
    boatImgHeight = Math.floor((boat.width - 2 * boatImgBuffer - buffer) / boat.capacity);

    for (i = 0; i < total+1; i++) {
        boatXLocs_L.push(boat.xloc_left  + boatImgBuffer + i * (boatImgHeight + boatImgBuffer));
        boatXLocs_R.push(boat.xloc_right + boatImgBuffer + i * (boatImgHeight + boatImgBuffer));
    }

    boat.picHeight = boatImgHeight;
    boat.picXLocs_L = boatXLocs_L;
    boat.picXLocs_R = boatXLocs_R;
    boat.picYLoc = boat.yloc + boatImgBuffer;

    prob = {
        boatPos: 'L',
        nOrcs: cond[1],
        nHobbits: cond[0],
        total: cond[1] + cond[0],
        boatCapacity: cond[2],
        nHobbitsL: cond[0],
        nOrcsL: cond[1],
        nHobbitsR: 0,
        nOrcsR: 0,
        nOrcsBoat: 0,
        nHobbitsBoat: 0,
        nOrcsR_prop: 0,
        nOrcsL_prop: cond[1],
        nHobbitsR_prop: 0,
        nHobbitsL_prop: cond[0],
        stepsRemaining: stepsRemaining,
        picHeight: imgHeight,
        picWidth: imgHeight
    };

}

function startProb() {
    $('#counter-placeholder').empty();
    $('#counter-placeholder').append('<p style="font-size:20px" align="center">'+ prob.stepsRemaining.toString() +' Moves Remaining</p>');
    drawState();
    specifyActions();
}

function drawState() {
    $("#instructions").empty();
    $('#hobbit-placeholder').empty();
    $('#hobbit-placeholder').append(hobbitCanvas[0]);
    $('#hobbit-placeholder').append('<br><br>');

    var ctx = hobbitCanvas[0].getContext("2d");

    // clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // left bank
    ctx.beginPath();
    ctx.rect(leftBank.xloc, leftBank.yloc, leftBank.width, leftBank.height);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "black";
    ctx.stroke();

    // right bank
    ctx.beginPath();
    ctx.rect(rightBank.xloc, rightBank.yloc, rightBank.width, rightBank.height);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "black";
    ctx.stroke();

    // boat
    imgArray = [];
    for (i=0; i < prob.nOrcsBoat; i++) {
        imgArray.push('O');
    }
    for (i=0; i < prob.nHobbitsBoat; i++) {
        imgArray.push('H');
    }

    ctx.beginPath();
    if (prob.boatPos === 'L') {
        ctx.rect(boat.xloc_left, boat.yloc, boat.width, boat.height);
    } else {
        ctx.rect(boat.xloc_right, boat.yloc, boat.width, boat.height);
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "black";
    ctx.stroke();

    for (i = 0; i < prob.nHobbitsBoat + prob.nOrcsBoat; i++){
        ctx.beginPath();
        if (imgArray.pop() === 'H'){
            if (prob.boatPos === 'L') {
                ctx.drawImage(imObH, boat.picXLocs_L[i],
                        boat.picYLoc, boat.picHeight, boat.picHeight);
            } else {
                ctx.drawImage(imObH, boat.picXLocs_R[i],
                        boat.picYLoc, boat.picHeight, boat.picHeight);
            }
        } else {
            if (prob.boatPos === 'L') {
                ctx.drawImage(imObO, boat.picXLocs_L[i],
                        boat.picYLoc, boat.picHeight, boat.picHeight);
            } else {
                ctx.drawImage(imObO, boat.picXLocs_R[i],
                        boat.picYLoc, boat.picHeight, boat.picHeight);
            }
        }
    }

    // hobbits and orcs on left bank
    nLeft = prob.nOrcsL_prop + prob.nHobbitsL_prop;
    if ((prob.total - nLeft)%2 === 0) {
        pos1 = (prob.total - nLeft) / 2;
        pos2 = prob.total - ((prob.total - nLeft) / 2);
    } else {
        pos1 = Math.floor((prob.total - nLeft) / 2);
        pos2 = prob.total - Math.ceil((prob.total - nLeft) / 2);
    }

    var imgArray = [];
    for (i=0; i<prob.nHobbitsL_prop; i++){
        imgArray.push('H');
    }
    for (i=0; i<prob.nOrcsL_prop; i++){
        imgArray.push('O');
    }

    for (i = pos1; i<pos2; i++) {
        if (imgArray.pop() === 'H'){
            ctx.drawImage(imObH, leftBank.picXLoc,
                  leftBank.picYLocs[i], prob.picHeight, prob.picWidth);
        } else {
            ctx.drawImage(imObO, leftBank.picXLoc,
                      leftBank.picYLocs[i], prob.picHeight, prob.picWidth);
        }
    }

    // left bank label
    ctx.font = "15px sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText("Hobbits: " + prob.nHobbitsL_prop.toString() + "\nOrcs: " + prob.nOrcsL_prop.toString(),
        leftBank.xloc - parseInt(lineWidth) / 2, canvasHeight - parseInt(lineWidth));


    // hobbits and orcs on right bank
    nRight = prob.nOrcsR_prop + prob.nHobbitsR_prop;
    if ((prob.total - nRight) % 2  === 0) {
        pos1 = (prob.total - nRight) / 2;
        pos2 = prob.total - ((prob.total - nRight) / 2);
    } else {
        pos1 = Math.floor((prob.total - nRight) / 2);
        pos2 = prob.total - Math.ceil((prob.total - nRight) / 2);
    }

    imgArray = [];
    for (i=0; i<prob.nHobbitsR_prop; i++){
        imgArray.push('H');
    }
    for (i=0; i<prob.nOrcsR_prop; i++){
        imgArray.push('O');
    }

    for (i = pos1; i<pos2; i++) {
        if (imgArray.pop() === 'H'){
        ctx.drawImage(imObH, rightBank.picXLoc,
              rightBank.picYLocs[i], prob.picHeight, prob.picWidth);
        } else {
            ctx.drawImage(imObO, rightBank.picXLoc,
                      rightBank.picYLocs[i], prob.picHeight, prob.picWidth);
        }
    }

    // right bank label
    ctx.font = "15px sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText("Hobbits: " + prob.nHobbitsR_prop.toString() + "\nOrcs: " + prob.nOrcsR_prop.toString(),
        rightBank.xloc - parseInt(lineWidth) / 2, canvasHeight - parseInt(lineWidth));

}


function specifyActions() {
    var col, buttons, orcs, hobs, plurH, plurO;
    var divs = '';
    var buttons = [];

    if (prob.boatPos === 'L') {
        orcs = prob.nOrcsL;
        hobs = prob.nHobbitsL;
    } else {
        orcs = prob.nOrcsR;
        hobs = prob.nHobbitsR;
    }

    for (i = 1; i < prob.boatCapacity+1; i++) {
        for (j = 0; j < prob.boatCapacity - i + 1; j++) {
            plurH = '';
            plurO = '';

            if (i === 0 && j === 0){
                continue;
            }

            if (i>1){plurH = 's';}
            if (j>1){plurO = 's';}

            if (j === 0){
                if (i <= orcs){
                    buttons.push('<input type="button" class="btn btn-default enabled" value="Place '+ i.toString() +' Orc' + plurH + ' in Boat" onclick="toBoat(0,' + i.toString() + ')">');
                } else {
                    buttons.push('<input type="button" class="btn btn-default disabled" value="Place '+ i.toString() +' Orc' + plurH + ' in Boat">');
                }

                if (i <= hobs){
                    buttons.push('<input type="button" class="btn btn-default enabled" value="Place '+ i.toString() +' Hobbit' + plurH + ' in Boat" onclick="toBoat(' + i.toString() + ', 0)">');
                } else {
                    buttons.push('<input type="button" class="btn btn-default disabled" value="Place '+ i.toString() +' Hobbit' + plurH + ' in Boat">');
                }
            } else {
                if (i <= hobs && j <= orcs){
                    buttons.push('<input type="button" class="btn btn-default enabled" value="Place '+ i.toString() +' Hobbit' + plurH + ' and ' + j.toString() + ' Orc ' + plurO + ' in Boat" onclick="toBoat('+ i.toString() + ', ' + j.toString() + ')">');
                } else {
                    buttons.push('<input type="button" class="btn btn-default disabled" value="Place '+ i.toString() +' Hobbit' + plurH + ' and ' + j.toString() + ' Orc ' + plurO + ' in Boat">');
                }
            }
        }
    }

    buttons.push('<button type="button" class="btn btn-success" onclick="onSubmit()">Submit Move</button>');
    for (i = 0; i < buttons.length; i++) {
        divs += buttons[i] + '<br>';
    }

    divs = '<h3 align="left">Actions</h3><div class="btn-group btn-group-vertical" align="left">' + divs + '</div>';

    $("#actions-placeholder").empty();
    $("#actions-placeholder").append(divs);
}

function toBoat(nHobs, nOrcs){
    $('#demo-placeholder').empty();

    prob.nOrcsBoat = nOrcs;
    prob.nHobbitsBoat = nHobs;

    // enter proposed move
    if (prob.boatPos == 'L') {
        prob.nOrcsL_prop = prob.nOrcsL - nOrcs;
        prob.nHobbitsL_prop = prob.nHobbitsL - nHobs;

    } else {
        prob.nOrcsR_prop = prob.nOrcsR - nOrcs;
        prob.nHobbitsR_prop = prob.nHobbitsR - nHobs;
    }
    drawState();

}


function onSubmit() {
    // update state
    if (prob.boatPos === 'L') {
        prob.nOrcsR += prob.nOrcsBoat;
        prob.nHobbitsR += prob.nHobbitsBoat;
        prob.nOrcsL -= prob.nOrcsBoat;
        prob.nHobbitsL -= prob.nHobbitsBoat;

    } else {
        prob.nOrcsR -= prob.nOrcsBoat;
        prob.nHobbitsR -= prob.nHobbitsBoat;
        prob.nOrcsL += prob.nOrcsBoat;
        prob.nHobbitsL += prob.nHobbitsBoat;
    }

    console.log((prob.nOrcsL > prob.nHobbitsL && prob.nHobbitsL > 0) || (prob.nOrcsR > prob.nHobbitsR && prob.nHobbitsR > 0) || (prob.nHobbitsBoat + prob.nOrcsBoat > 0));

    // check for solution
    if (prob.nHobbitsR === prob.nHobbits && prob.nOrcsR === prob.nOrcs) {
        success = 1;
        demographicsPage();

    // invalid move, un-update state
    } else if ((prob.nOrcsL > prob.nHobbitsL && prob.nHobbitsL > 0) || (prob.nOrcsR > prob.nHobbitsR && prob.nHobbitsR > 0) || (prob.nHobbitsBoat + prob.nOrcsBoat === 0)) {

        if (prob.boatPos === 'L') {
            prob.nOrcsR -= prob.nOrcsBoat;
            prob.nHobbitsR -= prob.nHobbitsBoat;
            prob.nOrcsL += prob.nOrcsBoat;
            prob.nHobbitsL += prob.nHobbitsBoat;
        } else {
            prob.nOrcsR += prob.nOrcsBoat;
            prob.nHobbitsR += prob.nHobbitsBoat;
            prob.nOrcsL -= prob.nOrcsBoat;
            prob.nHobbitsL -= prob.nHobbitsBoat;
        }

        // place error message specifying the move is invalid
        $('#demo-placeholder').empty();
        $('#demo-placeholder').append('<p style="color:red;font-size:20px" align="center"><strong>Invalid Move</strong></p>');

        prob.nOrcsL_prop = prob.nOrcsL;
        prob.nOrcsR_prop = prob.nOrcsR;
        prob.nHobbitsL_prop = prob.nHobbitsL;
        prob.nHobbitsR_prop = prob.nHobbitsR;
        prob.nHobbitsBoat = 0;
        prob.nOrcsBoat = 0;

        drawState();
        specifyActions();

    // otherwise, make the move
    } else {
        prob.nOrcsBoat = 0;
        prob.nHobbitsBoat = 0;

        if (prob.boatPos === 'L') {
            prob.boatPos = 'R';
        } else {
            prob.boatPos = 'L';
        }

        prob.stepsRemaining -= 1;
        prob.nOrcsL_prop = prob.nOrcsL;
        prob.nOrcsR_prop = prob.nOrcsR;
        prob.nHobbitsL_prop = prob.nHobbitsL;
        prob.nHobbitsR_prop = prob.nHobbitsR;
        prob.nHobbitsBoat = 0;
        prob.nOrcsBoat = 0;

        $('#counter-placeholder').empty();
        $('#counter-placeholder').append('<p style="font-size:20px" align="center">'+ prob.stepsRemaining.toString() +' Moves Remaining</p>');

        drawState();
        specifyActions();
    }
}

function showInstructions() {
    // getSubjectInfo();
    initProblem();
    $("#instructions").empty();
    $('#instructions').append('<div style="width:600px" align="left"><h3>Background</h3>Once upon a time, in the last days of Middle Earth, ' + prob.nHobbits.toString() + ' Hobbits and ' + prob.nOrcs.toString() + ' Orcs set out on a journey together. They were sent by the great wizard Gandalf to find one of the lost palantiri, or oracle stone. In the course of their journey they come to a river. On the bank is a small rowboat. All '+ prob.total.toString() +' travelers need to cross the river but <strong>the boat will hold only ' + prob.boatCapacity.toString() + ' of them at a time</strong>.<br><br>The Orcs are fierce and wicked creatures, who will try to kill the Hobbits if they get the opportunity. The Hobbits are normally gentle creatures, but are very good fighters if provoked. The Orcs know this, and will not try to attack the Hobbits unless the Orcs outnumber the Hobbits. That is, <strong>the Hobbits will be safe as long as there are at least as many Hobbits as Orcs on either side of the river</strong>.<br><br>Your goal is to move all of the Hobbits and Orcs across the river without killing them.</div><br><br>');
    $("#instructions").append('<div align="center"><input type="button" value="Continue" class="btn" onclick="startProb()"></div>');
}


function getSubjectInfo() {
    $.getJSON("http://ip-api.com/json/?callback=?", function(data) {
        var subInfo = {};

        $.each(data, function(k, v) {
            subInfo[k] = v;
        });

        if (!DEBUG) {
            ipAddress = subInfo.query;
        }

        var info = {
            userDisplayLanguage: navigator.language,
            userAgent: navigator.userAgent,
            ipAddress: ipAddress,
            country: subInfo.country,
            city: subInfo.city,
            region: subInfo.region,
            workerId: workerId
        };

        $.ajax({
            url: "./cgi-bin/getSubjectInfo_jugs.py",
            type: "POST",
            async: true,
            data: {
                query: JSON.stringify(info)
            },
            success: function(data) {
                data = JSON.parse(data);
//                console.log(data);

                if (data.subjectID === 0) {
                    $("#expt").empty();
                    $("#expt").append('<div class="text-center"><p>This experiment is currently at capacity. Please try again later.</p></div>');
                }

                cond1 = data.cond1;
                cond2 = data.cond2;

                condID = data.condID;

                subjectID = data.subjectID;
                approvalCode = data.approvalCode;

                if (data.approvalCode == 'denied') {
                    $("#expt").empty();
                    $("#expt").append('<div class="text-center"><p>This Worker ID or IP address has already participated in this task. Please return the HIT. Thanks!</p></div>');
                } else {
                    initProblem();
                }
            },
            error: function(string) {
                $("#expt").empty();
                $("#expt").append('<div class="text-center"><p>The database is having some trouble. Please contact the experimenter.</p></div>');
            }
        });
    });
}

// Eggplant
// Definitely shitakes
