var FPS = 60;
var GAME_TIME = 60;
var START_SCORE = 200;
var START_LEVEL = 1;
var PULL_FAST = 1.5;
var PULL_MEDIUM = 1.1;
var PULL_SLOW = 0.7;

var level;
var time;
var score;
var game_loop_interval;
var remaining_objects;
var black_interval;
var purple_interval;
var blue_interval;
var time_interval;
var pause = false;
var game_over_bool;
var black_holes = [];
var objects = [];
var object;
var scores_string;

var c = document.getElementById("game-canvas");
var ctx = c.getContext("2d");

var score1;
var score2;
var score3;

window.onload = setUp;
document.getElementById("start-button").onclick = start_game;
document.getElementById("pause-play-button").onclick = handle_pause;


function setUp() {
    
    // Default high scores to 0 if not set
    score1 = localStorage.getItem("score1") || 0;
    score2 = localStorage.getItem("score2") || 0;
    score3 = localStorage.getItem("score3") || 0;
    
    load_lvl_1();
    document.getElementById("start-page").style.display = "block";
    document.getElementById("transition-page").style.display = "none";
    document.getElementById("game-page").style.display = "none";
    document.getElementById("score-label").textContent = "high scores:";
    document.getElementById("title").textContent = "black holes";
    document.getElementById("start-button").textContent = "START";
    document.getElementById("level-num").textContent = level;
    document.addEventListener("click", handle_click);

    // Retrieve high scores from HTML Local Storage
    document.getElementById("high-scores1").textContent = score1;
    document.getElementById("high-scores2").textContent = score2;
    document.getElementById("high-scores3").textContent = score3;
}

function load_lvl_1() {
    clearInterval(black_interval);
    clearInterval(purple_interval);
    clearInterval(blue_interval);
    clearInterval(time_interval);
    clearInterval(game_loop_interval);
    
    game_over_bool = false;
    pause = false;
    black_holes = [];
    objects = [];  
    remaining_objects = 10;
    time = GAME_TIME;
    score = START_SCORE;
    level = START_LEVEL;
    
    document.getElementById("score-num").textContent = score;
}

function load_lvl_2() {
    clearInterval(black_interval);
    clearInterval(purple_interval);
    clearInterval(blue_interval);
    clearInterval(time_interval);
    clearInterval(game_loop_interval);
    
    pause = false;
    black_holes = [];
    objects = [];  
    remaining_objects = 10;
    time = GAME_TIME;
    level = 2;
    
    document.getElementById("score-num").textContent = score;
    document.getElementById("timer").textContent = time;
    document.getElementById("level-num").textContent = level;
}

function showTransitionScreen() {
    
    document.getElementById("transition-page").style.display = "block";
    document.getElementById("game-page").style.display = "none";
    
    if (game_over_bool == false) { // Transition screen between lvls 1 and 2
        document.getElementById("timer").textContent = GAME_TIME;
        document.getElementById("transition-score-label").textContent = "score:";
        document.getElementById("transition-scores").textContent = score;
        document.getElementById("transition-title").textContent = "Level " + level;
        document.getElementById("next-button").textContent = "NEXT";
        document.getElementById("next-button").onclick = start_game;
    } else { // Game over screen
        pause = true;
        document.getElementById("timer").textContent = GAME_TIME;
        document.getElementById("transition-score-label").textContent = "score:";
        document.getElementById("transition-scores").textContent = score;
        document.getElementById("transition-title").textContent = "GAME OVER";
        document.getElementById("next-button").textContent = "FINISH";
        document.getElementById("next-button").onclick = setUp;
    }
    
}

function game_loop() {
    if (pause === true) {
        return;
    }
    update_objects();
    draw_black_holes();
    draw_objects();
    
    if (remaining_objects === 0) {
        game_over();
    }
}

function start_game() {
    
    document.getElementById("start-page").style.display = "none";
    document.getElementById("transition-page").style.display = "none";
    document.getElementById("game-page").style.display = "block";
    
    generate_objects();

    // Black - every 45 secs
    // Purple - every 20 secs
    // Blue - every 8 secs
    // Respawn times halved for lvl 2
    black_interval = setInterval(generate_black_hole, (45000 / level), "black", 1);
    purple_interval = setInterval(generate_black_hole, (20000 / level), "purple", 2);
    blue_interval = setInterval(generate_black_hole, (8000 / level), "blue", 3);
    
    time--;
    time_interval = setInterval(handle_time, 1000);
    
    game_loop_interval = setInterval(game_loop, 1000/FPS);

} 

function game_over() {
    if (time <= 0 && remaining_objects > 0 && level === 1) {
        load_lvl_2();
        showTransitionScreen();
        
    } else {
        
        // Store high score if its higher than the currently stored score
        if (score1 < score) {
            localStorage.setItem("score3", localStorage.getItem("score2"));
            localStorage.setItem("score2", localStorage.getItem("score1"));
            localStorage.setItem("score1", score);
        } else if (score2 < score){
            localStorage.setItem("score3", localStorage.getItem("score2"));
            localStorage.setItem("score2", score);
        } else if (score3 < score){
            localStorage.setItem("score3", score);
        }
        
        // Set game over to true and move to transition screen
        game_over_bool = true;
        showTransitionScreen();
    }
}

function check_screen_edge() {
    
    // Inverse the direction if object is at edge of screen and moving outwards
    objects.forEach(function (object) {
        if (object.x >= 950 || object.x <= 0) {
            object.x_dir = 1 - object.x_dir;
        }

        if (object.y >= 550 || object.y <= 0) {
            object.y_dir = 1 - object.y_dir;
        }
    });
}

// Helper function
// Checks if the given object is in the given blackholes event horizon
function in_EH(bh, o) {
    if ((bh.x - 25 < o.x + 50) &&
        (bh.x + 75 > o.x) &&
        (bh.y - 25 < o.y + 50) &&
        (bh.y + 75 > o.y)) {
        return true;
    }
    
    return false;
}

function update_objects() {

    check_screen_edge();
    
    objects.forEach(function (object) {
        var speed = 1;
        black_holes.forEach(function (black_hole) {
            if ((black_hole.in_play == true) && (object.in_play == true)) {
                
                // Check if object is in the event horizon of a black hole
                if (in_EH(object, black_hole) == true) {
                    if (black_hole.type ==='black'){
                        speed = PULL_FAST;
                    } else if (black_hole.type === 'purple'){
                        speed = PULL_MEDIUM;
                    } else {
                        speed = PULL_SLOW;
                    }

                    // Update directions to pull towards black hole center
                    if (object.x < black_hole.x) {
                        object.x_dir = 1;
                    } else {
                        object.x_dir = 0;
                    }

                    if (object.y < black_hole.y) {
                        object.y_dir = 1;
                    } else {
                        object.y_dir = 0;
                    }

                    // Check if object in center of black hole
                    if (((black_hole.x - 2 <= object.x) && 
                         (object.x <= black_hole.x + 2)) && 
                        ((black_hole.y - 2 <= object.y) && 
                         (object.y <= black_hole.y + 2))) {
                        
                        // Update values after consume
                        object.in_play = false;
                        remaining_objects -= 1;
                        black_hole.remaining_consumes -= 1;
                        
                        // Update score
                        score -= 50;
                        document.getElementById("score-num").textContent = score;
                        
                        if (black_hole.remaining_consumes == 0) {
                            black_hole.in_play = false;
                        }
                    }
                }
            }
        })
        
        // Movement
        if (object.x_dir === 0) {
            object.x -= 1 * speed;
        } else {
            object.x += 1 * speed;
        }

        if (object.y_dir === 0) {
            object.y -= 1 * speed;
        } else {
            object.y += 1 * speed;
        }
    });
    
    // Clear screen to refresh
    ctx.clearRect(0, 0, 1000, 600);
    
}

function handle_click(e) {
    if  (pause === true) {
        return;
    }
    
    var distance;
    var x_dif;
    var y_dif;
    
    black_holes.forEach(function (black_hole) {
        if (black_hole.in_play == true) {
            x_dif = Math.pow((e.x - c.offsetLeft - (black_hole.x + 25)), 2);
            y_dif = Math.pow((e.y - c.offsetTop - (black_hole.y + 25)), 2);
            distance = Math.sqrt(x_dif + y_dif);

            if (distance <= 25) {
                black_hole.in_play = false;
                if (black_hole.type === 'black') {
                    score += 20;
                } else if (black_hole.type === 'purple') {
                    score += 10;
                } else { // blue black hole
                    score += 5;
                }

                document.getElementById("score-num").textContent = score;
            }
        }
    });
    
}

function handle_time() {
    if (pause === true) {
        return;
    } 
    
    document.getElementById("timer").textContent = time;
    
    if (time-- <= 0) {
        game_over();
    }
}

function handle_pause() {
    if (pause === false) {
        document.getElementById("pause-play-button").className = "play";
        document.getElementById("pause-play-button").textContent = "PLAY";
        document.getElementById("overlay").style.display = "flex";
    } else {
        document.getElementById("pause-play-button").className = "pause";
        document.getElementById("pause-play-button").textContent = "PAUSE";
        document.getElementById("overlay").style.display = "none";
    }
    
    pause = !pause;
}

////////////////////////////////////////
/// GENERATE OBJECTS AND BLACK HOLES ///
////////////////////////////////////////

function generate_planets() {

    var planet_types = ['planet1', 'planet2', 'planet3', 'planet4', 'planet5'];
    
    var i;
    for (i = 0; i < 5; i++) {
        object = {x: Math.floor((Math.random() * 925)) + 25,
                    y: Math.floor((Math.random() * 525)) + 25,
                    in_play: true,
                    x_dir: Math.floor((Math.random() * 2)),
                    y_dir: Math.floor((Math.random() * 2)),
                    type: planet_types[i]};
                
        while (object_overlap(object)) {
            object.x = Math.floor((Math.random() * 925)) + 25;
            object.y = Math.floor((Math.random() * 525)) + 25;
        }
        
        objects.push(object);
    }
    
}

function generate_satellites() {

    var satellite_types = ['satellite1', 'satellite2', 'satellite3', 'satellite4'];
        
    var i;
    for (i = 0; i < 4; i++) {
        object = {x: Math.floor((Math.random() * 925)) + 25,
                    y: Math.floor((Math.random() * 525)) + 25,
                    in_play: true,
                    x_dir: Math.floor((Math.random() * 2)),
                    y_dir: Math.floor((Math.random() * 2)),
                    type: satellite_types[i]};
        
        while (object_overlap(object)) {
            object.x = Math.floor((Math.random() * 925)) + 25;
            object.y = Math.floor((Math.random() * 525)) + 25;
        }
        
        objects.push(object);
    }
}

function generate_ufos() {
    
    object = {x: Math.floor((Math.random() * 925)) + 25,
                y: Math.floor((Math.random() * 525)) + 25,
                in_play: true,
                x_dir: Math.floor((Math.random() * 2)),
                y_dir: Math.floor((Math.random() * 2)),
                type: 'ufo'};
    
    while (object_overlap(object)) {
        object.x = Math.floor((Math.random() * 925)) + 25;
        object.y = Math.floor((Math.random() * 525)) + 25;
    }
    
    objects.push(object);
    
}

function generate_black_hole(bh_type, consumes) {
    
    if (pause === true){
        return;
    }
    
    var black_hole = {x: Math.floor((Math.random() * 925)) + 25,
                     y: Math.floor((Math.random() * 525)) + 25,
                     in_play: true,
                     remaining_consumes: consumes,
                     type: bh_type};

    while (bh_overlap(black_hole)) {
        black_hole.x = Math.floor((Math.random() * 925)) + 25;
        black_hole.y = Math.floor((Math.random() * 525)) + 25;
    }
    
    black_holes.push(black_hole);
        
}

// Helper function
// Checks if the given black hole overlaps with previously generated black holes
function bh_overlap(blackHole) {
    
    var overlap = false;
    black_holes.forEach(function (black_hole) {
        if (collides(blackHole, black_hole)) {
            overlap = true;
        }
    });
    
    return overlap;
}

// Helper function
// Checks if the given object overlaps with previously generated objects
function object_overlap(object2) {
    
    var overlap = false;
    objects.forEach(function (object) {
        if (collides(object, object2)) {
            overlap = true;
        }
    });
    
    return overlap;
}

// Helper function
// Checks if the 2 given black holes collide
function collides(bh1, bh2) {
    if ((bh1.x - 25 < bh2.x + 75) &&
        (bh1.x + 75 > bh2.x - 25) &&
        (bh1.y - 25 < bh2.y + 75) &&
        (bh1.y + 75 > bh2.y - 25)) {
        return true;
    }
    
    return false;
}

function generate_objects() {
    generate_planets();
    generate_satellites();
    generate_ufos();
}

///////////////////////////////////
/// DRAW OBJECTS AND BLACKHOLES ///
///////////////////////////////////

function draw_satellite_1(satellite) {

    ctx.lineWidth = 0.1;
    
    var grd = ctx.createLinearGradient(satellite.x, satellite.y + 20, satellite.x + 20, satellite.y + 40);
    grd.addColorStop(0,"#474747");
    grd.addColorStop(1,"yellow");

    // gradient for right panel
    var grd2 = ctx.createLinearGradient(satellite.x + 30, satellite.y + 20, satellite.x + 50, satellite.y + 40);
    grd2.addColorStop(0,"#474747");
    grd2.addColorStop(1,"yellow");
	
    ctx.beginPath();
    ctx.fillStyle = "#272727"; // grey
    ctx.fillRect(satellite.x+17, satellite.y+28, 16, 4); // middle rect (horizontal)
	ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = grd; // yellow
	ctx.fillRect(satellite.x, satellite.y + 25, 17, 10); // left panel
    ctx.rect(satellite.x, satellite.y + 25, 17, 10);
	ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = grd2; // yellow
	ctx.fillRect(satellite.x + 33, satellite.y + 25, 17, 10); // right panel
    ctx.rect(satellite.x + 33, satellite.y + 25, 17, 10);
	ctx.stroke();

    ctx.fillStyle = "#272727"; // grey
	ctx.fillRect(satellite.x + 19, satellite.y + 20, 12, 20); // middle body (vertical)

    ctx.fillStyle = "#474747"; // grey
	ctx.fillRect(satellite.x + 25, satellite.y + 22, 4, 16); // middle body (vertical)

	ctx.beginPath();
	ctx.arc(satellite.x + 25, satellite.y + 25, 15, 1.25 * Math.PI, -0.75, false); // disk upper half
	ctx.arc(satellite.x + 25, satellite.y + 5, 15, 0.75, -1.25 * Math.PI, false); // disk lower half
    ctx.fillStyle = "#0066CC"; // blue
    ctx.fill();
	ctx.stroke();
	
    // antenna stick
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.moveTo(satellite.x + 25, satellite.y + 5);
	ctx.lineTo(satellite.x + 25, satellite.y + 15); 
	ctx.stroke();
	
     // antenna node 
	ctx.beginPath();
	ctx.arc(satellite.x + 25, satellite.y + 5, 1, 2 * Math.PI, 0, false);
	ctx.stroke();

}

function draw_satellite_2(satellite) {
    
    ctx.lineWidth = 1;
    ctx.fillStyle = "#284F9B"; // dark blue (panels)
	
	// left panel
	ctx.fillRect(satellite.x , satellite.y + 25, 4, 4); 
	ctx.fillRect(satellite.x, satellite.y + 30, 4, 4); 
	ctx.fillRect(satellite.x, satellite.y + 35, 4, 4); 
	
	ctx.fillRect(satellite.x + 5, satellite.y + 25, 4, 4); 
	ctx.fillRect(satellite.x + 5, satellite.y + 30, 4, 4);
	ctx.fillRect(satellite.x + 5, satellite.y + 35, 4, 4); 
	
	ctx.fillRect(satellite.x + 10, satellite.y + 25, 4, 4);
	ctx.fillRect(satellite.x + 10, satellite.y + 30, 4, 4); 
	ctx.fillRect(satellite.x + 10, satellite.y + 35, 4, 4);
	
	ctx.fillRect(satellite.x + 15, satellite.y + 25, 4, 4);
	ctx.fillRect(satellite.x + 15, satellite.y + 30, 4, 4); 
	ctx.fillRect(satellite.x + 15, satellite.y + 35, 4, 4);
	
	// right panel
	ctx.fillRect(satellite.x + 31, satellite.y + 25, 4, 4); 
	ctx.fillRect(satellite.x + 31, satellite.y + 30, 4, 4); 
	ctx.fillRect(satellite.x + 31, satellite.y + 35, 4, 4); 
	
	ctx.fillRect(satellite.x + 36, satellite.y + 25, 4, 4); 
	ctx.fillRect(satellite.x + 36, satellite.y + 30, 4, 4);
	ctx.fillRect(satellite.x + 36, satellite.y + 35, 4, 4); 
	
	ctx.fillRect(satellite.x + 41, satellite.y + 25, 4, 4);
	ctx.fillRect(satellite.x + 41, satellite.y + 30, 4, 4); 
	ctx.fillRect(satellite.x + 41, satellite.y + 35, 4, 4);
	
	ctx.fillRect(satellite.x + 46, satellite.y + 25, 4, 4);
	ctx.fillRect(satellite.x + 46, satellite.y + 30, 4, 4); 
	ctx.fillRect(satellite.x + 46, satellite.y + 35, 4, 4);

    ctx.fillStyle = "#272727"; // grey
	ctx.fillRect(satellite.x + 20, satellite.y + 20, 10, 25); // middle rect (body)

    ctx.fillStyle = "#474747"; // grey
    ctx.fillRect(satellite.x + 26, satellite.y + 23, 3, 18); // middle rect (shadow)
	
     // antenna 
	ctx.beginPath();
	ctx.moveTo(satellite.x + 25, satellite.y + 12);
	ctx.lineTo(satellite.x + 25, satellite.y + 20); 
	ctx.stroke();
	
    // signal waves
	ctx.beginPath();
    ctx.strokeStyle = "grey";
	ctx.arc(satellite.x + 25, satellite.y + 20, 14, 1.3 * Math.PI, -0.9, false);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.arc(satellite.x + 25, satellite.y + 21, 12, 1.3 * Math.PI, -0.9, false);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.arc(satellite.x + 25, satellite.y + 22, 10, 1.3 * Math.PI, -0.9, false);
	ctx.stroke();
	
}

function draw_satellite_3(satellite) {
    
    ctx.strokeStyle = "black";
	ctx.fillStyle = "purple" ; // panel color
	
	// left panel
	ctx.fillRect(satellite.x, satellite.y+30, 20, 10); 
	
	// right panel
	ctx.fillRect(satellite.x+30, satellite.y+30, 20, 10);
    
    ctx.fillStyle = "#272727"; // grey
	ctx.fillRect(satellite.x+21, satellite.y+28, 8, 20); // middle rect (body)

    ctx.fillStyle = "#474747"; // grey
    ctx.fillRect(satellite.x+26, satellite.y+30, 2, 13); // middle rect (shadow)
	
    // antenna stick
	ctx.beginPath();
    ctx.lineWidth = 1;
	ctx.moveTo(satellite.x+25, satellite.y+28); 
	ctx.lineTo(satellite.x+25, satellite.y+25); 
	ctx.stroke();
    
    // antenna node
    ctx.beginPath();
	ctx.arc(satellite.x+25, satellite.y+24, 1, 2*Math.PI, 0, false);
    ctx.fill();
	ctx.stroke();
	
    // signal waves
	ctx.beginPath();
    ctx.strokeStyle = "grey";
	ctx.arc(satellite.x+25, satellite.y+26, 16, Math.PI, 0, false);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.arc(satellite.x+25, satellite.y+26, 12, Math.PI, 0, false);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.arc(satellite.x+25, satellite.y+26, 8, Math.PI, 0, false);
	ctx.stroke();
}

function draw_satellite_4(satellite) {
    
    var grd = ctx.createLinearGradient(satellite.x+30, satellite.y+10, satellite.x+40, satellite.y+20);
    grd.addColorStop(0,"#676767");
    grd.addColorStop(1,"grey");
    
    // Body
	ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.1;
	ctx.arc(satellite.x+35, satellite.y+15, 9, 0, 2*Math.PI, false);
    ctx.fillStyle = grd;
    ctx.fill();
	ctx.stroke();
    
    // Legs
    ctx.beginPath();
    ctx.strokeStyle = "#a7a7a7";
    ctx.lineWidth = 2;
	ctx.moveTo(satellite.x+30, satellite.y+8); 
    ctx.lineTo(satellite.x+3, satellite.y+20);
	ctx.stroke();
    
    ctx.beginPath();
	ctx.moveTo(satellite.x+32, satellite.y+17); 
    ctx.lineTo(satellite.x+5, satellite.y+35);
	ctx.stroke();
    
    ctx.beginPath();
	ctx.moveTo(satellite.x+40, satellite.y+21); 
    ctx.lineTo(satellite.x+20, satellite.y+40);
	ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = "#663300";
	ctx.moveTo(satellite.x+30, satellite.y+8); 
    ctx.lineTo(satellite.x+32, satellite.y+17);
    ctx.lineTo(satellite.x+40, satellite.y+21);
	ctx.stroke();
    
}

function draw_ufo(ufo){
    
    // gradient for spaceship glass
    var grd = ctx.createLinearGradient(ufo.x + 10, ufo.y + 10, ufo.x + 40, ufo.y + 40);
    grd.addColorStop(0,"#272727");
    grd.addColorStop(1,"green");

    // gradient for spaceship body
    var grd2 = ctx.createLinearGradient(ufo.x + 20, ufo.y + 20, ufo.x + 40, ufo.y + 40);
    grd2.addColorStop(0,"#272727");
    grd2.addColorStop(1,"#676767");

    ctx.beginPath();
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = "black";
	ctx.arc(ufo.x + 25, ufo.y + 60, 41, -2.1, -1.05, false); // disk (behind)
    ctx.arc(ufo.x + 46, ufo.y + 28, 3, -0.5 * Math.PI, 0.5 * Math.PI, false); // corner
	ctx.arc(ufo.x + 25, ufo.y - 5, 42, 1.05, 2.1, false); // disk (front)
    ctx.arc(ufo.x + 4, ufo.y + 28, 3, 0.5 * Math.PI, -0.5 * Math.PI, false); // corner
    ctx.fillStyle = grd2;
    ctx.fill();
	ctx.stroke();

    // circles on ship body
    ctx.beginPath();
    ctx.arc(ufo.x + 10, ufo.y + 27, 2, 2 * Math.PI, 0, false);
    ctx.fillStyle = "white";
    ctx.fill();
	ctx.stroke();

    ctx.beginPath();
    ctx.arc(ufo.x + 25, ufo.y + 32, 2, 2 * Math.PI, 0, false);
    ctx.fillStyle = "white";
    ctx.fill();
	ctx.stroke();

    ctx.beginPath();
    ctx.arc(ufo.x + 40, ufo.y + 27, 2, 2 * Math.PI, 0, false);
    ctx.fillStyle = "white";
    ctx.fill();
	ctx.stroke();

    // glass dome
	ctx.beginPath();
	ctx.arc(ufo.x + 25, ufo.y + 25, 10, Math.PI, 0, false);
	ctx.arc(ufo.x + 25, ufo.y - 13, 40, 1.38, 1.83, false);
    ctx.fillStyle = grd;
    ctx.fill();
	ctx.stroke();

}

function draw_planet_1(planet) {

    // gradient for planet
    var grd = ctx.createLinearGradient(planet.x+10, planet.y+10, planet.x+40, planet.y+40);
    grd.addColorStop(0,"#272727");
    grd.addColorStop(1,"blue");

    // planet ring (behind)
	ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "lightblue";
	ctx.arc(planet.x+55, planet.y+55, 50, 3.46, -1.9, false);
    ctx.stroke();

    // planet
	ctx.beginPath();
    ctx.lineWidth = 0.5;
	ctx.arc(planet.x+25, planet.y+25, 15, 0, 2*Math.PI, false);
    ctx.fillStyle = grd;
    ctx.fill();
	ctx.stroke();
   
    // planet ring 1 (infront)
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "lightblue";
	ctx.arc(planet.x-5, planet.y-5, 50, 0.32, 1.25, false);
	ctx.stroke();

    // planet ring (bottom left)
	ctx.beginPath();
	ctx.arc(planet.x+10, planet.y+40, 2, 1, -2, false);
    ctx.stroke();

    // planet ring (top right)
	ctx.beginPath();
	ctx.arc(planet.x+40, planet.y+10, 2, 4, 1, false);
    ctx.stroke();
	
}

function draw_planet_2(planet) {
    
    // gradient for planet
    var grd = ctx.createLinearGradient(planet.x + 10, planet.y + 10, planet.x + 40, planet.y + 40);
    grd.addColorStop(0,"#272727");
    grd.addColorStop(1,"red");

    // gradient for crater
    var grd2 = ctx.createLinearGradient(planet.x + 10, planet.y + 10, planet.x + 20, planet.y + 20);
    grd2.addColorStop(0,"red");
    grd2.addColorStop(1,"#272727");

    // gradient for crater 2
    var grd3 = ctx.createLinearGradient(planet.x + 20, planet.y + 15, planet.x + 30, planet.y + 25);
    grd3.addColorStop(0,"red");
    grd3.addColorStop(1,"#272727");

    // gradient for crater 3
    var grd4 = ctx.createLinearGradient(planet.x + 15, planet.y + 30, planet.x + 30, planet.y + 25);
    grd4.addColorStop(0,"red");
    grd4.addColorStop(1,"#272727");

    // gradient for crater 4
    var grd5 = ctx.createLinearGradient(planet.x + 30, planet.y + 25, planet.x + 40, planet.y + 35);
    grd5.addColorStop(0,"red");
    grd5.addColorStop(1,"#272727");

    ctx.lineWidth = 0.1;


    // planet
	ctx.beginPath();
	ctx.arc(planet.x + 25, planet.y + 25, 25, 0, 2 * Math.PI, false);
    ctx.fillStyle = grd;
    ctx.fill();
	ctx.stroke();

    // planet crater
	ctx.beginPath();
	ctx.arc(planet.x + 15, planet.y + 15, 3, 0, 2 * Math.PI, false);
    ctx.fillStyle = grd2;
    ctx.fill();
	ctx.stroke();

    // planet crater 2
	ctx.beginPath();
	ctx.arc(planet.x + 25, planet.y + 20, 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = grd3;
    ctx.fill();
	ctx.stroke();

    // planet crater 3
	ctx.beginPath();
	ctx.arc(planet.x + 20, planet.y + 35, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = grd4;
    ctx.fill();
	ctx.stroke();

    // planet crater 4
	ctx.beginPath();
	ctx.arc(planet.x + 35, planet.y + 30, 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = grd5;
    ctx.fill();
	ctx.stroke();

}

function draw_planet_3(planet) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.1;
    
    // gradient for moon
    var grd = ctx.createLinearGradient(planet.x+10, planet.y+10, planet.x+40, planet.y+40);
    grd.addColorStop(0,"#676767");
    grd.addColorStop(1,"white");
    
    var grd2 = ctx.createLinearGradient(planet.x+15, planet.y+30, planet.x+30, planet.y+25);
    grd2.addColorStop(0,"white");
    grd2.addColorStop(1,"#272727");
    
    var grd3 = ctx.createLinearGradient(planet.x+15, planet.y+30, planet.x+30, planet.y+25);
    grd3.addColorStop(0,"white");
    grd3.addColorStop(1,"#272727");
    
    // moon
	ctx.beginPath();
	ctx.arc(planet.x+25, planet.y+25, 20, 0, 1.5*Math.PI, false);
    ctx.arc(planet.x+32, planet.y+19, 12, 1.5*Math.PI, 0, true);
    ctx.fillStyle = grd;
    ctx.fill();
	ctx.stroke();
    
    // craters
	ctx.beginPath();
	ctx.arc(planet.x+20, planet.y+35, 5, 0, 2*Math.PI, false);
    ctx.fillStyle = grd2;
    ctx.fill();
    ctx.strokeStyle = "#c7c7c7";
	ctx.stroke();
    
    ctx.beginPath();
	ctx.arc(planet.x+15, planet.y+20, 3, 0, 2*Math.PI, false);
    ctx.fillStyle = grd3;
    ctx.fill();
    ctx.strokeStyle = "grey";
	ctx.stroke();
}

function draw_planet_4(planet) {
    
    var grd = ctx.createLinearGradient(planet.x, planet.y, planet.x+50, planet.y+50);
    grd.addColorStop(0,"#FFFFFF");
    grd.addColorStop(1,"#F3C088");
    
    // planet
	ctx.beginPath();
    ctx.strokeStyle = "#F3C088";
    ctx.lineWidth = 2;
	ctx.arc(planet.x+25, planet.y+25, 24, 0, 2*Math.PI, false);
    ctx.fillStyle = grd;
    ctx.fill();
	ctx.stroke();
    
    // shades on planet
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FEE0B8";
	ctx.moveTo(planet.x+30, planet.y+2); 
    ctx.lineTo(planet.x+2, planet.y+30);
	ctx.stroke();
    
    ctx.beginPath();
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#FED5A2";
	ctx.moveTo(planet.x+36, planet.y+4); 
    ctx.lineTo(planet.x+5, planet.y+36);
	ctx.stroke();
    
    ctx.beginPath();
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#E7B175";
	ctx.moveTo(planet.x+46, planet.y+14); 
    ctx.lineTo(planet.x+14, planet.y+46);
	ctx.stroke();
    
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#F2BF88";
	ctx.moveTo(planet.x+48, planet.y+21); 
    ctx.lineTo(planet.x+22, planet.y+47);
	ctx.stroke();
    
    // planet outline
	ctx.beginPath();
    ctx.strokeStyle = "#FEE0B8";
    ctx.lineWidth = 2;
	ctx.arc(planet.x+25, planet.y+25, 24, 0, 2*Math.PI, false);
	ctx.stroke();
}

function draw_planet_5(planet) {
        
    var grd=ctx.createLinearGradient(planet.x+10, planet.y+10, planet.x+40, planet.y+40);
    grd.addColorStop(0,"#3D362D");
    grd.addColorStop(1,"#663300");
    
    // Asteroid
	ctx.beginPath();
    ctx.lineWidth = 0.1;
	ctx.moveTo(planet.x+20, planet.y+12); 
	ctx.lineTo(planet.x+15, planet.y+20); 
    ctx.lineTo(planet.x+5, planet.y+21); 
    ctx.lineTo(planet.x+10, planet.y+35); 
    ctx.lineTo(planet.x+18, planet.y+40); 
    ctx.lineTo(planet.x+30, planet.y+37);
    ctx.lineTo(planet.x+40, planet.y+41);
    ctx.lineTo(planet.x+44, planet.y+32);
    ctx.lineTo(planet.x+45, planet.y+20);
    ctx.lineTo(planet.x+25, planet.y+10);
    ctx.lineTo(planet.x+20, planet.y+12);
    ctx.fillStyle = grd;
    ctx.fill();
	ctx.stroke();
    
    // Cracks
    ctx.beginPath();
    ctx.strokeStyle = "#685642";
    ctx.lineWidth = 2;
	ctx.moveTo(planet.x+20, planet.y+12); 
    ctx.lineTo(planet.x+25, planet.y+20);
    ctx.lineTo(planet.x+18, planet.y+35);
    ctx.lineTo(planet.x+38, planet.y+20);
    ctx.lineTo(planet.x+30, planet.y+37);
	ctx.stroke();
    
}

function draw_black_holes() {

    black_holes.forEach(function (black_hole){
        
        if (black_hole.in_play){
            var gradient = ctx.createRadialGradient(black_hole.x + 25, black_hole.y + 25, 10,
                                                black_hole.x + 25, black_hole.y + 25, 25);
        
            if (black_hole.type === 'black') {
                gradient.addColorStop(0, 'black');
                gradient.addColorStop(1, 'lightgrey');
            } else if (black_hole.type === 'blue') {
                gradient.addColorStop(0, 'blue');
                gradient.addColorStop(1, 'lightblue');
            } else { // purple
                gradient.addColorStop(0, 'darkviolet');
                gradient.addColorStop(1, 'violet');
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(black_hole.x + 25, black_hole.y + 25, 25, 0, 2*Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        
    });
    
}

function draw_objects() {
    
    objects.forEach(function (object){
    
        if (object.in_play) {
            if (object.type === 'planet1') {
                draw_planet_1(object);
            } else if (object.type === 'planet2') {
                draw_planet_2(object);
            } else if (object.type === 'planet3') {
                draw_planet_3(object);
            } else if (object.type === 'planet4') {
                draw_planet_4(object);
            } else if (object.type === 'planet5') {
                draw_planet_5(object);
            } else if (object.type === 'satellite1') {
                draw_satellite_1(object);
            } else if (object.type === 'satellite2') {
                draw_satellite_2(object);
            } else if (object.type === 'satellite3') {
                draw_satellite_3(object);
            } else if (object.type === 'satellite4') {
                draw_satellite_4(object);
            } else if (object.type === 'ufo') {
                draw_ufo(object);
            } 
        }   
    });
    
}

