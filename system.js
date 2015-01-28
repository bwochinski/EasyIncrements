var Engine = { //the main Engine object
	/** variables **/
	Info: { //the engine info
		Version: 0.1 //engine version number
	},
	Settings: {
	  CanvasSize: [800,600],
	  Background: {},
	  SaveInterval: 20, //In seconds
	  HudFont: "Verdana",
	  HudSize: 18,
	  HudColor: "white",
	  StatusLocation: [250, 600-32], //Engine.Canvas.height - 32],
	  ParticleColor: "orange",
	  ParticleSize: 32,
	  ParticleFont: "Arial",
	  UpgradeLocation: [650, 32],
	  UpgradeSize: [150, 40],
	  ShowPurchased: true
	},
	Player: { //the player object
		Clicks: 0, //total clicks
		CurPage: null,
		Currency: {} //Stores all currency information
	},
	StatusMessage: "", //status message
	Canvas: { //the canvas object
		Element: null, //this will be a canvas element
		Context: null //this will become a 2d context
	},
	Timers: { //this holds all sorts of timers
		Increment: null, //this is the main currency increment timer,
		StatusMessage: null, //this is so we can reset the status message timer
		SaveGame: null, //Regularly save the game
	},

	Pages: {},
	Achievements: {},
	Images: {},

	/** functions **/
	Init: function() { //initialize the engine and start game loop
		Engine.Canvas = document.createElement('canvas'); //create a canvas element
		Engine.Canvas.id = "display"; //give it an id to reference later
		Engine.Canvas.width = Engine.Settings.CanvasSize[0]; //the width
		Engine.Canvas.height = Engine.Settings.CanvasSize[1]; //the height
		$('body').append(Engine.Canvas); //finally append the canvas to the page

		if (window.localStorage.getItem("incremental-player")) { //does a save exist
			Engine.Load(); //load save game
		}

		Engine.AddClick(); //start the main click event
		Engine.StartAutoSave(); //start auto-saving progress
		Engine.StartIncrement(); //start the auto coins
		Engine.Canvas.Context = Engine.Canvas.getContext('2d'); //set the canvas to render in 2d.
		Engine.GameLoop(); //start rendering the game!

	},
	SetHud: function(size, font, color) {
	  Engine.Settings.HudSize = size;
	  Engine.Settings.HudFont = font;
	  Engine.Settings.HudColor = color;
	},
	CreatePage: function(name) {
		Engine.Pages[name] = {
			Particles: [],
			Buttons: {},
			Upgrades: {},
			Display: {}
		};
	},
	ShowPage: function(name) {
		Engine.Player.CurPage = name;
	},
	CreateCurrency: function(name, ShwPerClick, ShwPerSec) {
		if (ShwPerClick == null) {
			ShwPerClick = true;
		}
		if (ShwPerSec == null) {
			ShwPerSec = true;
		}
	  Engine.Player.Currency[name] = {
	    Count: 0,
	    PerClick: 1,
	    PerSec: 0,
	    ShowPerSec: ShwPerSec,
	    ShowPerClick: ShwPerClick
	  };
	},
	CreateButton: function(name, page, btn) {
	  Engine.Pages[page].Buttons[name] = btn;
	},
	CreateAchievement: function(name, achv) {
	  Engine.Achievements[name] = achv;
	},
	CreateUpgrade: function(name, page, upgrd) {
	  Engine.Pages[page].Upgrades[name] = upgrd;
	},
	CreateParticle: function(page, ix, iy, chr) {
		if (chr == null) {
			chr = "+";
		}
		var x = Math.floor(Math.random() * 64) + ix; //get a random x
		var y = Math.floor(Math.random() * 32) + iy; //get a random y
		Engine.Pages[page].Particles.push({ x:x, y:y, o:10.0, char: chr }); //push the particle into the array
	},
	AddImage: function(name, fileName) {
	  Engine.Images[name] = { File: fileName, Image: new Image() };
	  Engine.Images[name].Image.src = fileName;
	},
	SetBackground: function(imgName) {
		if (Engine.Images[imgName]) {
	  	Engine.Settings.Background = imgName;
		} else {
			console.log("Error setting background to " + imgName + ", image object does not exist.");
		}
	},
	ClickCurrency: function(curn) {
	  Engine.Player.Clicks++; //add a click
	  Engine.IncCurrency(curn, Engine.Player.Currency[curn].PerClick);
	},
	IncCurrency: function(curn, amt) { //the new coin adding function
		Engine.Player.Currency[curn].Count += amt; //increase coins by amount
		Engine.CheckAchievements(); //check achievements
	},
	DecCurrency: function(curn, amt) {
	  if (Engine.Player.Currency[curn].Count >= amt ) {
	    Engine.Player.Currency[curn].Count -= amt;
	    return true;
	  } else {
	    return false;
	  }
	},
	MultiDecCurrency: function(curnList) {
	  for (var i = 0; i < curnList.length; i++) {
	    if (Engine.Player.Currency[curnList[i][0]].Count < curnList[i][1]) {
	      Engine.Status("Error: Not enough " + curnList[i][0]);
	      return false;
	    }
	  }

	  for (var i = 0; i < curnList.length; i++) {
	    Engine.Player.Currency[curnList[i][0]].Count -= curnList[i][1];
	  }
	  return true;
	},
	CheckAchievements: function() {
		for (var a in Engine.Achievements) { //loop through each achievement in the array
		  if (Engine.Achievements[a].Get !== true) {
  			if (Engine.Achievements[a].Condition()) { //have you matched the achievement clicks?
  			  Engine.Achievements[a].Get = true;
  				Engine.Status("ACHIEVEMENT! " + Engine.Achievements[a].Name); //show message with achievement name
  				if (Engine.Achievements[a].Callback) {
  				  Engine.Achievements[a].Callback();
  				}
  			}
		  }
		}
	},
	BuyUpgrade: function(up) {
	  if (Engine.MultiDecCurrency(up.Cost)) {
	    up.Get = true;
	    up.Callback();
	    Engine.Status("UPGRADE! " + up.Text);
	  }
	},
	Status: function(txt) { //show status function
		Engine.StatusMessage = txt; //assign the text
		clearTimeout(Engine.Timers.StatusMessage); //clear the timeout
		Engine.Timers.StatusMessage = setTimeout(function() { //reset the timeout
			Engine.StatusMessage = ""; //set the status back to nothing
			clearTimeout(Engine.Timers.StatusMessage); //clear it
			Engine.Timers.StatusMessage = null; //set to null for completeness
		}, 3000);
	},
	Save: function() { //save function
		window.localStorage.setItem("incremental-info", JSON.stringify(Engine.Info)); //set localstorage for engine info
		window.localStorage.setItem("incremental-player", JSON.stringify(Engine.Player)); //set localstorage for player
		window.localStorage.setItem("incremental-achievements", JSON.stringify(Engine.Achievements)); //set localstorage for achievements
		window.localStorage.setItem("incremental-pages", JSON.stringify(Engine.Pages)); //set localstorage for upgrades
		Engine.Status("Saved!"); //show status message
	},
	Load: function() { //load function
		if (window.localStorage.getItem("incremental-info")) {
			var version = JSON.parse(window.localStorage.getItem("incremental-info"));
			if (version.Version <= Engine.Info.Version) {
			  //$.extend(true,object1,object2);
				$.extend(true,Engine.Player, JSON.parse(window.localStorage.getItem("incremental-player"))); //load player
				$.extend(true,Engine.Achievements, JSON.parse(window.localStorage.getItem("incremental-achievements"))); //load achievements
				$.extend(true,Engine.Pages, JSON.parse(window.localStorage.getItem("incremental-pages"))); //load achievements
				Engine.Save(); //resave the new versioned data
				Engine.Info = JSON.parse(window.localStorage.getItem("incremental-info"));
				Engine.Status("Loaded!"); //show status message
			} else if (version.Version > Engine.Info.Version) {
				Engine.Status("ERROR: Your save file is newer than the game, please reset.");
			}
		} else {
			Engine.Status("No save game found."); //no save game
		}
	},
	Reset: function() { //delete save function
		var areYouSure = confirm("Are you sure?\r\nYOU WILL LOSE YOUR SAVE!!"); //make sure the user is aware
		if (areYouSure == true) { //if they click yep
			window.localStorage.removeItem("incremental-info"); //delete
			window.localStorage.removeItem("incremental-player"); //delete
			window.localStorage.removeItem("incremental-upgrades"); //delete
			window.localStorage.removeItem("incremental-achievements"); //delete
			window.localStorage.removeItem("incremental-buttons"); //delete
			window.location.reload(); //refresh page to restart
		}
	},

	/** event handlers **/
	StartIncrement: function() { //automatic currency
		Engine.Timers.Increment = setInterval(function() { //set the Timer as an interval
		  for (var curn in Engine.Player.Currency) {
			  Engine.IncCurrency(curn, Engine.Player.Currency[curn].PerSec);
			};
		}, 1000);
	},
	StartAutoSave: function() {
	  Engine.Timers.SaveGame = setInterval(function () {
	    Engine.Save();
	  }, Engine.Settings.SaveInterval * 1000);
	},
	AddClick: function() { //the click function
		$(Engine.Canvas).on('click', function(m) { //we add a click to the Engine.Canvas object (note the 'm')
		  for (var en in Engine.Pages[Engine.Player.CurPage].Buttons) {
		    if (Engine.Pages[Engine.Player.CurPage].Buttons[en].Callback) {
          if (m.pageX >= Engine.Pages[Engine.Player.CurPage].Buttons[en].x && m.pageX <= (Engine.Pages[Engine.Player.CurPage].Buttons[en].x + Engine.Pages[Engine.Player.CurPage].Buttons[en].w) && m.pageY >= Engine.Pages[Engine.Player.CurPage].Buttons[en].y && m.pageY <= (Engine.Pages[Engine.Player.CurPage].Buttons[en].y + Engine.Pages[Engine.Player.CurPage].Buttons[en].h)) {
            Engine.Pages[Engine.Player.CurPage].Buttons[en].Callback();
          }
		    }
		  }

		  //upgrade buttons click checking
		  var upOffset = 0;
  		for (var u in Engine.Pages[Engine.Player.CurPage].Upgrades) {
  		  var curUp = Engine.Pages[Engine.Player.CurPage].Upgrades[u];
  		  if (Engine.Settings.ShowPurchased == true || curUp.Get !== true) {
          if (m.pageX >= Engine.Settings.UpgradeLocation[0] && m.pageX <= (Engine.Settings.UpgradeLocation[0] + Engine.Settings.UpgradeSize[0]) && m.pageY >= (Engine.Settings.UpgradeLocation[1] + upOffset) && m.pageY <= (Engine.Settings.UpgradeLocation[1] + Engine.Settings.UpgradeSize[1] + upOffset)) {
            Engine.BuyUpgrade(curUp);
          }
  		    upOffset += Engine.Settings.UpgradeSize[1] + 8;
  		  }
  		}

			return false;
		}).on('mousedown', function(m) {

		}).on('mouseup', function(m) {

		});
	},

	/** animation routines **/
	GameRunning: null,
	Update: function() { //update game objects
		for (var p = 0; p < Engine.Pages[Engine.Player.CurPage].Particles.length; p++) { //loop through particles
			Engine.Pages[Engine.Player.CurPage].Particles[p].y--; //move up by 1px
			Engine.Pages[Engine.Player.CurPage].Particles[p].o -= 0.1; //reduce opacity by 0.1
			if (Engine.Pages[Engine.Player.CurPage].Particles[p].o <= 0.0) { //if it's invisible
				Engine.Pages[Engine.Player.CurPage].Particles.splice(p,1); //remove the particle from the array
			}
		}
		Engine.Draw(); //call the canvas draw function
	},
	Draw: function() { //render game
		Engine.Canvas.Context.clearRect(0,0,Engine.Canvas.width,Engine.Canvas.height); //clear the frame

		/** background **/
		if (Engine.Images[Engine.Settings.Background]) {
  		Engine.Image(Engine.Images[Engine.Settings.Background].Image, 0, 0, Engine.Canvas.width, Engine.Canvas.height, 1); //background image drawing
		}

		/** display/hud **/
		var curOffset = 32;
		for (var cur in Engine.Player.Currency) {
		  Engine.Text(Engine.Player.Currency[cur].Count + " " + cur, 16, curOffset, Engine.Settings.HudFont, Engine.Settings.HudSize, Engine.Settings.HudColor, 1); //currency display
		  curOffset += Engine.Settings.HudSize;
		  if (Engine.Player.Currency[cur].ShowPerSec) {
		  	Engine.Text(Engine.Player.Currency[cur].PerSec + " " + cur + " per second", 16, curOffset, Engine.Settings.HudFont, Engine.Settings.HudSize, Engine.Settings.HudColor, 1); //currency display
		  	curOffset += Engine.Settings.HudSize;
			}
			if (Engine.Player.Currency[cur].ShowPerClick) {
		  	Engine.Text(Engine.Player.Currency[cur].PerClick + " " + cur + " per click", 16, curOffset, Engine.Settings.HudFont, Engine.Settings.HudSize, Engine.Settings.HudColor, 1); //per click display
		  	curOffset += Engine.Settings.HudSize;
			}
		}

		//render upgrade buttons
		var upOffset = 0;
		for (var u in Engine.Pages[Engine.Player.CurPage].Upgrades) {
		  var curUp = Engine.Pages[Engine.Player.CurPage].Upgrades[u];
		  if (Engine.Settings.ShowPurchased == true || curUp.Get !== true) {
		    var curColor = "lightgreen";
		    if (curUp.Get) {
		      curColor = "silver";
		    }
		    Engine.Button({
		      x: Engine.Settings.UpgradeLocation[0],
		      y: Engine.Settings.UpgradeLocation[1] + upOffset,
		      w: Engine.Settings.UpgradeSize[0],
		      h: Engine.Settings.UpgradeSize[1],
		      color: curColor,
		      opacity: 1,
		      text: curUp.Text,
		      text_font: "Verdana",
		      text_size: 12,
		      text_color: "black",
		      text_opacity: 1,
		      yAlign: "top"
		    });
		    var strCost = "";
		    for (var i = 0; i < curUp.Cost.length; i++) {
		      if (strCost) { strCost += ", "; }
		      strCost += curUp.Cost[i][1] + " " + curUp.Cost[i][0];
		    }
		    Engine.Text(
		        strCost,
		        Engine.Settings.UpgradeLocation[0],
		        Engine.Settings.UpgradeLocation[1] + upOffset,
		        "Verdana",
		        10,
		        "black",
		        1,
		        Engine.Settings.UpgradeSize[0],
		        Engine.Settings.UpgradeSize[1],
		        "center",
		        "bottom"
		      );
		    upOffset += Engine.Settings.UpgradeSize[1] + 8;
		  }
		}

		//Render Buttons from Object
    for (var btn in Engine.Pages[Engine.Player.CurPage].Buttons) {
      Engine.Button(Engine.Pages[Engine.Player.CurPage].Buttons[btn]);
    }

    /** Display Status Message **/
    Engine.Text(Engine.StatusMessage, Engine.Settings.StatusLocation[0] + 1, Engine.Settings.StatusLocation[1] + 1, Engine.Settings.HudFont, Engine.Settings.HudSize, "black", 1); //new status message
		Engine.Text(Engine.StatusMessage, Engine.Settings.StatusLocation[0], Engine.Settings.StatusLocation[1], Engine.Settings.HudFont, Engine.Settings.HudSize, "orange", 1); //new status message

    /** particle rendering **/
		for (var p = 0; p < Engine.Pages[Engine.Player.CurPage].Particles.length; p++) {
      Engine.Text(Engine.Pages[Engine.Player.CurPage].Particles[p].char, Engine.Pages[Engine.Player.CurPage].Particles[p].x + 1, Engine.Pages[Engine.Player.CurPage].Particles[p].y + 1, Engine.Settings.ParticleFont, Engine.Settings.ParticleSize, "black", Engine.Pages[Engine.Player.CurPage].Particles[p].o);
			Engine.Text(Engine.Pages[Engine.Player.CurPage].Particles[p].char, Engine.Pages[Engine.Player.CurPage].Particles[p].x, Engine.Pages[Engine.Player.CurPage].Particles[p].y, Engine.Settings.ParticleFont, Engine.Settings.ParticleSize, Engine.Settings.ParticleColor, Engine.Pages[Engine.Player.CurPage].Particles[p].o);
		}

		Engine.GameLoop(); //re-iterate back to gameloop
	},

	GameLoop: function() { //the gameloop function
		Engine.GameRunning = setTimeout(function() {
			requestAnimFrame(Engine.Update, Engine.Canvas);  //call animation frame
		}, 1);
	},

	/** drawing routines **/
	Button: function (btn) {
    if (btn.image) {
      Engine.Image(Engine.Images[btn.image].Image, btn.x, btn.y, btn.w, btn.h, btn.opacity);
    } else if(btn.color) {
      Engine.Rect(btn.x, btn.y, btn.w, btn.h, btn.color, btn.opacity);
    }
    if (btn.text) {
      var xAlign = "center";
      var yAlign = "center";
      if (btn.xAlign) { xAlign = btn.xAlign; }
      if (btn.yAlign) { yAlign = btn.yAlign; }
      Engine.Text(btn.text, btn.x, btn.y, btn.text_font, btn.text_size, btn.text_color, btn.text_opacity, btn.w, btn.h, xAlign, yAlign);
    }
	},
	Image: function(img,x,y,w,h,opac) { //image drawing function, x position, y position, width, height and opacity
		if (opac) { //if opacity exists
			Engine.Canvas.Context.globalAlpha = opac; //amend it
		}
		Engine.Canvas.Context.drawImage(img,x,y,w,h); //draw image
		Engine.Canvas.Context.globalAlpha = 1.0; //reset opacity
	},
	Rect: function(x,y,w,h,col,opac) { //x position, y position, width, height and colour
		if (col) { //if you have included a colour
			Engine.Canvas.Context.fillStyle = col; //add the colour!
		}
		if (opac > 0) { //if opacity exists
			Engine.Canvas.Context.globalAlpha = opac; //reset opacity
		}
		Engine.Canvas.Context.fillRect(x,y,w,h); //draw the rectangle
		Engine.Canvas.Context.globalAlpha = 1.0;
	},
	Text: function(text,x,y,font,size,col,opac,w,h,centerX,centerY) { //the text, x position, y position, font (arial, verdana etc), font size and colour
		if (col) { //if you have included a colour
			Engine.Canvas.Context.fillStyle = col; //add the colour!
		}
		if (opac > 0) { //if opacity exists
			Engine.Canvas.Context.globalAlpha = opac; //amend it
		}
		Engine.Canvas.Context.font = size + "px " + font; //set font style
		if (centerX == "center" && w) {
		  var textW = Engine.Canvas.Context.measureText(text).width;
		  x = x + ((w/2) - (textW/2));
		} else if (centerX == "left" && w) {
		  x = x + (w * 0.5);
		} else if (centerX == "right" && w) {
		  var textW = Engine.Canvas.Context.measureText(text).width;
		  x = x + (w - textW - (w * 0.05));
		}
	  if (centerY == "center" && h) {
		  y = y + (h * 0.6);
	  } else if (centerY == "top" && h) {
	    y = y + size + 4;
	  } else if (centerY == "bottom" && h) {
	    y = y + h - 4;
	  }
		Engine.Canvas.Context.fillText(text,x,y); //show text
		Engine.Canvas.Context.globalAlpha = 1.0; //reset opacity
	}
};
/** This is a request animation frame function that gets the best possible animation process for your browser, I won't go into specifics; just know it's worth using ;) **/
window.requestAnimFrame = (function(){
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
	function (callback, element){
		fpsLoop = window.setTimeout(callback, 1000 / 60);
	};
}());

Number.prototype.roundTo = function(num) { //new rounding function
	var resto = this%num;
	return this+num-resto; //return rounded down to nearest "num"
}

