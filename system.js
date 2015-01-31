function newEngine(canvasW,canvasH) { //the main Engine constructor

	/** variables **/
	var Info = { //the engine info
		Version: 0.1 //engine version number
	};
	
	var Settings = {
	  CanvasSize: [canvasW,canvasH],
	  Background: {},
	  SaveInterval: 20, //In seconds
	  HudFont: "Verdana",
	  HudSize: 18,
	  HudColor: "white",
	  StatusLocation: [250, 600-32], //Canvas.height - 32],
	  ParticleColor: "orange",
	  ParticleSize: 32,
	  ParticleFont: "Arial",
	  UpgradeLocation: [650, 32],
	  UpgradeSize: [150, 40],
	  ShowPurchased: true
	};
	
	var GetSetting = function(name) {
		if (Settings[name] !== null) {
			return Settings[name];
		}
	};
	
	var SetSetting = function(name, val) {  //list any number of settings: SetSetting(name1, val1, name2, val2 .. nameN, valN)
		for (var i = 1; i < arguments.length; i += 2) {
			Settings[arguments[i-1]] = arguments[i];
		}
	};
	
	var Player = { //the player object
		Clicks: 0, //total clicks
		CurPage: null,
		CurButton: null,
		CurUpgrade: null,
		MouseDown: false,
		Currency: {} //Stores all currency information
	};
	
	var GetPlayer = function(name) {
		return Player[name];
	};
	
	var StatusMessage = ""; //status message
	
	var Canvas = { //the canvas object
		Element: null, //this will be a canvas element
		Context: null //this will become a 2d context
	};
	
	var Timers = { //this holds all sorts of timers
		Increment: null, //this is the main currency increment timer,
		StatusMessage: null, //this is so we can reset the status message timer
		SaveGame: null, //Regularly save the game
	};

	var Pages = {};
	var Achievements = {};
	var Images = {};

	/** functions **/
	var Init = function() { //initialize the engine and start game loop
		Canvas = document.createElement('canvas'); //create a canvas element
		Canvas.id = "display"; //give it an id to reference later
		Canvas.width = Settings.CanvasSize[0]; //the width
		Canvas.height = Settings.CanvasSize[1]; //the height
		$('body').append(Canvas); //finally append the canvas to the page

		if (window.localStorage.getItem("eiEngine-info")) { //does a save exist
			Load(); //load save game
		}

		AddClick(); //start the main click event
		StartAutoSave(); //start auto-saving progress
		StartIncrement(); //start the auto coins
		Canvas.Context = Canvas.getContext('2d'); //set the canvas to render in 2d.
		setCanvasPos();
		GameLoop(); //start rendering the game!

	};
	
	var SetHud = function(size, font, color) {
	  Settings.HudSize = size;
	  Settings.HudFont = font;
	  Settings.HudColor = color;
	};
	
	var CreatePage = function(name) {
		Pages[name] = {
			Particles: new Array(),
			Buttons: {},
			Upgrades: {},
			Display: {}
		};
	};
	
	var ShowPage = function(name) {
		Player.CurPage = name;
	};
	
	var CreateCurrency = function(name, ShwPerClick, ShwPerSec) {
		if (ShwPerClick == null) {
			ShwPerClick = true;
		}
		if (ShwPerSec == null) {
			ShwPerSec = true;
		}
	  Player.Currency[name] = {
	    Count: 0,
	    PerClick: 1,
	    PerSec: 0,
	    ShowPerSec: ShwPerSec,
	    ShowPerClick: ShwPerClick
	  };
	};
	
	var GetCurrency = function(name, attrib) {
		return Player.Currency[name][attrib];
	};
	
	var AlterCurrency = function(name, attrib, val) {
		if (isInt(val)) {
			Player.Currency[name][attrib] += val;
		} else {
			Player.Currency[name][attrib] = val;
		}
	};
	
	var CreateButton = function(name, page, btn) {
	  Pages[page].Buttons[name] = btn;
	};
	
	var UpdateButton = function(name, page, btn) {
		$.extend(true,Pages[page].Buttons[name],btn);
	};
	
	var CreateAchievement = function(name, achv) {
	  Achievements[name] = achv;
	};
	
	var CreateUpgrade = function(name, page, upgrd) {
	  Pages[page].Upgrades[name] = upgrd;
	};
	
	var CreateParticle = function(page, ix, iy, chr) {
		if (chr == null) {
			chr = "+";
		}
		var x = Math.floor(Math.random() * 64) + ix; //get a random x
		var y = Math.floor(Math.random() * 32) + iy; //get a random y
		Pages[page].Particles.push({ x:x, y:y, o:10.0, chr: chr }); //push the particle into the array
	};
	
	var AddImage = function(name, fileName) {
	  Images[name] = { File: fileName, Image: new Image() };
	  Images[name].Image.src = fileName;
	};
	
	var SetBackground = function(imgName) {
		if (Images[imgName]) {
	  	Settings.Background = imgName;
		} else {
			console.log("Error setting background to " + imgName + ", image object does not exist.");
		}
	};
	
	var ClickCurrency = function(curn) {
	  Player.Clicks++; //add a click
	  IncCurrency(curn, Player.Currency[curn].PerClick);
	};
	
	var IncCurrency = function(curn, amt) { //the new coin adding function
		Player.Currency[curn].Count += amt; //increase coins by amount
		CheckAchievements(); //check achievements
	};
	
	var DecCurrency = function(curn, amt) {
	  if (Player.Currency[curn].Count >= amt ) {
	    Player.Currency[curn].Count -= amt;
	    return true;
	  } else {
	    return false;
	  }
	};
	
	var MultiDecCurrency = function(curnList) {
	  for (var i = 0; i < curnList.length; i++) {
	    if (Player.Currency[curnList[i][0]].Count < curnList[i][1]) {
	      SetStatus("Error: Not enough " + curnList[i][0]);
	      return false;
	    }
	  }

	  for (var i = 0; i < curnList.length; i++) {
	    Player.Currency[curnList[i][0]].Count -= curnList[i][1];
	  }
	  return true;
	};
	
	var CheckAchievements = function() {
		for (var a in Achievements) { //loop through each achievement in the array
		  if (Achievements[a].Get !== true) {
  			if (Achievements[a].Condition()) { //have you matched the achievement clicks?
  			  Achievements[a].Get = true;
  				SetStatus("ACHIEVEMENT! " + Achievements[a].Name); //show message with achievement name
  				if (Achievements[a].Callback) {
  				  Achievements[a].Callback();
  				}
  			}
		  }
		}
	};
	
	var BuyUpgrade = function(upgrd) {
		var up = Pages[Player.CurPage].Upgrades[upgrd];
		if (up.Get !== true) {
		  if (MultiDecCurrency(up.Cost)) {
		    up.Get = true;
		    up.Callback();
		    SetStatus("UPGRADE! " + up.Text);
		  }
		}
	};
	
	var SetStatus = function(txt) { //show status function
		StatusMessage = txt; //assign the text
		clearTimeout(Timers.StatusMessage); //clear the timeout
		Timers.StatusMessage = setTimeout(function() { //reset the timeout
			StatusMessage = ""; //set the status back to nothing
			clearTimeout(Timers.StatusMessage); //clear it
			Timers.StatusMessage = null; //set to null for completeness
		}, 3000);
	};
	
	var Save = function() { //save function
		window.localStorage.setItem("eiEngine-info", JSON.stringify(Info)); //set localstorage for engine info
		window.localStorage.setItem("eiEngine-settings", JSON.stringify(Settings)); //set localstorage for engine info
		window.localStorage.setItem("eiEngine-player", JSON.stringify(Player)); //set localstorage for player
		window.localStorage.setItem("eiEngine-achievements", JSON.stringify(Achievements)); //set localstorage for achievements
		window.localStorage.setItem("eiEngine-pages", JSON.stringify(Pages)); //set localstorage for upgrades
		SetStatus("Saved!"); //show status message
	};
	
	var Load = function() { //load function
		if (window.localStorage.getItem("eiEngine-info")) {
			var version = JSON.parse(window.localStorage.getItem("eiEngine-info"));
			if (version.Version <= Info.Version) {
			  //$.extend(true,object1,object2);
			  $.extend(true,Settings, JSON.parse(window.localStorage.getItem("eiEngine-settings"))); //load player
				$.extend(true,Player, JSON.parse(window.localStorage.getItem("eiEngine-player"))); //load player
				$.extend(true,Achievements, JSON.parse(window.localStorage.getItem("eiEngine-achievements"))); //load achievements
				$.extend(true,Pages, JSON.parse(window.localStorage.getItem("eiEngine-pages"))); //load achievements
				Save(); //resave the new versioned data
				Info = JSON.parse(window.localStorage.getItem("eiEngine-info"));
				SetStatus("Loaded!"); //show status message
			} else if (version.Version > Info.Version) {
				SetStatus("ERROR: Your save file is newer than the game, please reset.");
			}
		} else {
			SetStatus("No save game found."); //no save game
		}
	};
	
	var Reset = function() { //delete save function
		var areYouSure = confirm("Are you sure?\r\nYOU WILL LOSE YOUR SAVE!!"); //make sure the user is aware
		if (areYouSure == true) { //if they click yep
			window.localStorage.removeItem("eiEngine-info"); //delete
			window.localStorage.removeItem("eiEngine-settings"); //delete
			window.localStorage.removeItem("eiEngine-player"); //delete
			window.localStorage.removeItem("eiEngine-achievements"); //delete
			window.localStorage.removeItem("eiEngine-pages"); //delete
			window.location.reload(); //refresh page to restart
		}
	};

	/** event handlers **/
	var StartIncrement = function() { //automatic currency
		Timers.Increment = setInterval(function() { //set the Timer as an interval
		  for (var curn in Player.Currency) {
			  IncCurrency(curn, Player.Currency[curn].PerSec);
			}
		}, 1000);
	};
	
	var StartAutoSave = function() {
	  Timers.SaveGame = setInterval(function () {
	    Save();
	  }, Settings.SaveInterval * 1000);
	};
	
	//Get position relative to the Canvas, not the page
	var getCanvasPos = function(canvas, evt) {
	  //var rect = canvas.getBoundingClientRect();
	  return {
	    X: Math.round((evt.clientX-Canvas.Rect.left)/(Canvas.Rect.right-Canvas.Rect.left)*Canvas.width),
			Y: Math.round((evt.clientY-Canvas.Rect.top)/(Canvas.Rect.bottom-Canvas.Rect.top)*Canvas.height)
	  };
	};
	
	//Re-get canvas size and position, called on resize
	var setCanvasPos = function() {
		Canvas.Rect = Canvas.getBoundingClientRect();
	};
	
	var setCurButton = function(name, upgrade) {
		if (upgrade !== true) {
			if (Player.CurButton !== null && Player.CurButton != name) {
				Pages[Player.CurPage].Buttons[Player.CurButton].Clicked = false;
			}
			Player.CurButton = name;
			if (name !== null && Player.MouseDown == true) {
				Pages[Player.CurPage].Buttons[name].Clicked = true;
			}
		} else {
			if (Player.CurUpgrade !== null && Player.CurUpgrade != name) {
				Pages[Player.CurPage].Upgrades[Player.CurUpgrade].Clicked = false;
			}
			Player.CurUpgrade = name;
			if (name !== null && Player.MouseDown == true) {
				Pages[Player.CurPage].Upgrades[name].Clicked = true;
			}
		}
	};
	
	var AddClick = function() { //the click function
		$(Canvas).on('click', function(evt) { //we add a click to the Canvas object (note the 'evt')
			
			return false;
		}).mousemove(function(evt) {
			evt = getCanvasPos(Canvas, evt);
		  for (var n in Pages[Player.CurPage].Buttons) {
		    if (Pages[Player.CurPage].Buttons[n].Callback) {
          if (evt.X >= Pages[Player.CurPage].Buttons[n].x && evt.X <= (Pages[Player.CurPage].Buttons[n].x + Pages[Player.CurPage].Buttons[n].w) && evt.Y >= Pages[Player.CurPage].Buttons[n].y && evt.Y <= (Pages[Player.CurPage].Buttons[n].y + Pages[Player.CurPage].Buttons[n].h)) {
            setCurButton(n);
            return false;
          }
		    }
		  }
		  setCurButton(null);

		  //upgrade buttons click checking
		  var upOffset = 0;
  		for (var u in Pages[Player.CurPage].Upgrades) {
  		  var curUp = Pages[Player.CurPage].Upgrades[u];
  		  if (Settings.ShowPurchased == true || curUp.Get !== true) {
          if (evt.X >= Settings.UpgradeLocation[0] && evt.X <= (Settings.UpgradeLocation[0] + Settings.UpgradeSize[0]) && evt.Y >= (Settings.UpgradeLocation[1] + upOffset) && evt.Y <= (Settings.UpgradeLocation[1] + Settings.UpgradeSize[1] + upOffset)) {
            setCurButton(u, true);
            return false;
          }
  		    upOffset += Settings.UpgradeSize[1] + 8;
  		  }
  		}
  		setCurButton(null, true);

			return false;
		});
		
		//Get canvas size and position on window resize
		$(window).resize(function() {
			setCanvasPos();
		}).on('mousedown', function(evt) { //watch for mouse down events anywhere
			Player.MouseDown = true;
			if (Player.CurButton !== null) {
				Pages[Player.CurPage].Buttons[Player.CurButton].Clicked = true;
			} else if (Player.CurUpgrade !== null) {
				Pages[Player.CurPage].Upgrades[Player.CurUpgrade].Clicked = true;
			}
			return false;
		}).on('mouseup', function(evt) { // watch for mouse up events anywhere
			Player.MouseDown = false;
			if (Player.CurButton !== null) {
				Pages[Player.CurPage].Buttons[Player.CurButton].Clicked = false;
				Pages[Player.CurPage].Buttons[Player.CurButton].Callback();
			} else if (Player.CurUpgrade !== null) {
				Pages[Player.CurPage].Upgrades[Player.CurUpgrade].Clicked = false;
				BuyUpgrade(Player.CurUpgrade);
			}
			return false;
		});
	};

	/** animation routines **/
	var Update = function() { //update game objects
		for (var p = 0; p < Pages[Player.CurPage].Particles.length; p++) { //loop through particles
			Pages[Player.CurPage].Particles[p].y--; //move up by 1px
			Pages[Player.CurPage].Particles[p].o -= 0.1; //reduce opacity by 0.1
			if (Pages[Player.CurPage].Particles[p].o <= 0.0) { //if it's invisible
				Pages[Player.CurPage].Particles.splice(p,1); //remove the particle from the array
			}
		}
		Draw(); //call the canvas draw function
	};
	
	var Draw = function() { //render game
		Canvas.Context.clearRect(0,0,Canvas.width,Canvas.height); //clear the frame

		/** background **/
		if (Images[Settings.Background]) {
  		RenderImage(Images[Settings.Background].Image, 0, 0, Canvas.width, Canvas.height, 1); //background image drawing
		}

		/** display/hud **/
		var curOffset = 32;
		for (var cur in Player.Currency) {
		  RenderText(Player.Currency[cur].Count + " " + cur, 16, curOffset, Settings.HudFont, Settings.HudSize, Settings.HudColor, 1); //currency display
		  curOffset += Settings.HudSize;
		  if (Player.Currency[cur].ShowPerSec) {
		  	RenderText(Player.Currency[cur].PerSec + " " + cur + " per second", 16, curOffset, Settings.HudFont, Settings.HudSize, Settings.HudColor, 1); //currency display
		  	curOffset += Settings.HudSize;
			}
			if (Player.Currency[cur].ShowPerClick) {
		  	RenderText(Player.Currency[cur].PerClick + " " + cur + " per click", 16, curOffset, Settings.HudFont, Settings.HudSize, Settings.HudColor, 1); //per click display
		  	curOffset += Settings.HudSize;
			}
		}

		//render upgrade buttons
		var upOffset = 0;
		for (var u in Pages[Player.CurPage].Upgrades) {
		  var curUp = Pages[Player.CurPage].Upgrades[u];
		  if (Settings.ShowPurchased == true || curUp.Get !== true) {
		    var curColor = "lightgreen";
		    if (curUp.Get) {
		      curColor = "silver";
		    }
		    RenderButton({
		      x: Settings.UpgradeLocation[0],
		      y: Settings.UpgradeLocation[1] + upOffset,
		      w: Settings.UpgradeSize[0],
		      h: Settings.UpgradeSize[1],
		      color: curColor,
		      opacity: 1,
		      text: curUp.Text,
		      text_font: "Verdana",
		      text_size: curUp.text_size,
		      text_color: curUp.text_color,
		      text_opacity: 1,
		      yAlign: "top",
		      Clicked: curUp.Clicked,
		      image: curUp.Image
		    });
		    var strCost = "";
		    for (var i = 0; i < curUp.Cost.length; i++) {
		      if (strCost) { strCost += ", "; }
		      strCost += curUp.Cost[i][1] + " " + curUp.Cost[i][0];
		    }
		    RenderText(
		        strCost,
		        Settings.UpgradeLocation[0],
		        Settings.UpgradeLocation[1] + upOffset,
		        "Verdana",
		        curUp.text_size - 2,
		        curUp.text_color,
		        1,
		        Settings.UpgradeSize[0],
		        Settings.UpgradeSize[1],
		        "center",
		        "bottom"
		      );
		    upOffset += Settings.UpgradeSize[1] + 8;
		  }
		}

		//Render Buttons from Object
    for (var btn in Pages[Player.CurPage].Buttons) {
      RenderButton(Pages[Player.CurPage].Buttons[btn]);
    }

    /** Display Status Message **/
    RenderText(StatusMessage, Settings.StatusLocation[0] + 1, Settings.StatusLocation[1] + 1, Settings.HudFont, Settings.HudSize, "black", 1); //new status message
		RenderText(StatusMessage, Settings.StatusLocation[0], Settings.StatusLocation[1], Settings.HudFont, Settings.HudSize, "orange", 1); //new status message

    /** particle rendering **/
		for (var p = 0; p < Pages[Player.CurPage].Particles.length; p++) {
      RenderText(Pages[Player.CurPage].Particles[p].chr, Pages[Player.CurPage].Particles[p].x + 1, Pages[Player.CurPage].Particles[p].y + 1, Settings.ParticleFont, Settings.ParticleSize, "black", Pages[Player.CurPage].Particles[p].o);
			RenderText(Pages[Player.CurPage].Particles[p].chr, Pages[Player.CurPage].Particles[p].x, Pages[Player.CurPage].Particles[p].y, Settings.ParticleFont, Settings.ParticleSize, Settings.ParticleColor, Pages[Player.CurPage].Particles[p].o);
		}

		GameLoop(); //re-iterate back to gameloop
	};
	
	var GameRunning = null;
	var GameLoop = function() { //the gameloop function
		GameRunning = setTimeout(function() {
			window.requestAnimFrame(Update, Canvas);  //call animation frame
		}, 1);
	};

	/** drawing routines **/
	var RenderButton = function (btn) {
		var tbtn = {};
		$.extend(true, tbtn, btn);
		if (tbtn.Clicked == true) {
			tbtn.x += 2;
			tbtn.y += 2;
			tbtn.w -= 4;
			tbtn.h -= 4;
		}
    if (tbtn.image) {
      RenderImage(Images[tbtn.image].Image, tbtn.x, tbtn.y, tbtn.w, tbtn.h, tbtn.opacity);
    } else if(tbtn.color) {
      RenderRect(tbtn.x, tbtn.y, tbtn.w, tbtn.h, tbtn.color, tbtn.opacity);
    }
    if (tbtn.text) {
      var xAlign = "center";
      var yAlign = "center";
      if (tbtn.xAlign) { xAlign = tbtn.xAlign; }
      if (tbtn.yAlign) { yAlign = tbtn.yAlign; }
      RenderText(tbtn.text, tbtn.x, tbtn.y, tbtn.text_font, tbtn.text_size, tbtn.text_color, tbtn.text_opacity, tbtn.w, tbtn.h, xAlign, yAlign);
    }
	};
	
	var RenderImage = function(img,x,y,w,h,opac) { //image drawing function, x position, y position, width, height and opacity
		if (opac) { //if opacity exists
			Canvas.Context.globalAlpha = opac; //amend it
		}
		Canvas.Context.drawImage(img,x,y,w,h); //draw image
		Canvas.Context.globalAlpha = 1.0; //reset opacity
	};
	
	var RenderRect = function(x,y,w,h,col,opac) { //x position, y position, width, height and colour
		if (col) { //if you have included a colour
			Canvas.Context.fillStyle = col; //add the colour!
		}
		if (opac > 0) { //if opacity exists
			Canvas.Context.globalAlpha = opac; //reset opacity
		}
		Canvas.Context.fillRect(x,y,w,h); //draw the rectangle
		Canvas.Context.globalAlpha = 1.0;
	};
	
	var RenderText = function(text,x,y,font,size,col,opac,w,h,centerX,centerY) { //the text, x position, y position, font (arial, verdana etc), font size and colour
		if (col) { //if you have included a colour
			Canvas.Context.fillStyle = col; //add the colour!
		}
		if (opac > 0) { //if opacity exists
			Canvas.Context.globalAlpha = opac; //amend it
		}
		Canvas.Context.font = size + "px " + font; //set font style
		if (centerX == "center" && w) {
		  var textW = Canvas.Context.measureText(text).width;
		  x = x + ((w/2) - (textW/2));
		} else if (centerX == "left" && w) {
		  x = x + (w * 0.5);
		} else if (centerX == "right" && w) {
		  var textW = Canvas.Context.measureText(text).width;
		  x = x + (w - textW - (w * 0.05));
		}
	  if (centerY == "center" && h) {
		  y = y + (h * 0.6);
	  } else if (centerY == "top" && h) {
	    y = y + size + 4;
	  } else if (centerY == "bottom" && h) {
	    y = y + h - 4;
	  }
		Canvas.Context.fillText(text,x,y); //show text
		Canvas.Context.globalAlpha = 1.0; //reset opacity
	};
	
	return {
		GetSetting: GetSetting,
		SetSetting: SetSetting,
		GetPlayer: GetPlayer,
		Init: Init,
		SetHud: SetHud,
		CreatePage: CreatePage,
		ShowPage: ShowPage,
		CreateCurrency: CreateCurrency,
		GetCurrency: GetCurrency,
		AlterCurrency: AlterCurrency,
		CreateButton: CreateButton,
		UpdateButton: UpdateButton,
		CreateAchievement: CreateAchievement,
		CreateUpgrade: CreateUpgrade,
		CreateParticle: CreateParticle,
		AddImage: AddImage,
		SetBackground: SetBackground,
		ClickCurrency: ClickCurrency,
		IncCurrency: IncCurrency,
		DecCurrency: DecCurrency,
		MultiDecCurrency: MultiDecCurrency,
		SetStaus: SetStatus,
		Save: Save,
		Load: Load,
		Reset: Reset
	};
	
}

/** This is a request animation frame function that gets the best possible animation process for your browser, I won't go into specifics; just know it's worth using ;) **/
window.requestAnimFrame = (function(){
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
	function (callback, element){
		var fpsLoop = window.setTimeout(callback, 1000 / 60);
	};
}());

Number.prototype.roundTo = function(num) { //new rounding function
	var resto = this%num;
	return this+num-resto; //return rounded down to nearest "num"
};

function isInt(value) {
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
}

