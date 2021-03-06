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
	  HudColor: "black",
	  StatusLocation: [canvasW * 0.3, 32], //Canvas.height - 32],
	  ParticleColor: "orange",
	  ParticleSize: 32,
	  ParticleFont: "Arial",
	  UpgradeLocation: [650, 32],
	  UpgradeSize: [150, 40],
	  ShowPurchased: true,
	  FrameTabs: {
	  	TabHeight: 24,
	  	TabSpacing: 8,
	  	TabActive: "white",
	  	TabInactive: "silver",
	  	text_size: 14,
	  	text_color: "black"
	  }
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
		CurButtonPg: null,
		CurUpgrade: null,
		CurUpgradePg: null,
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
		Achievements: null //Check achievements on a timer
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
		$(Canvas).css("border", "1px solid gray"); //set a border on the canvas

		if (window.localStorage.getItem("eiEngine-info")) { //does a save exist
			Load(); //load save game
		}

		AddClick(); //start the main click event
		StartAutoSave(); //start auto-saving progress
		StartIncrement(); //start the auto coins
		achievementTimer(); //check for achievements once per second
		Canvas.Context = Canvas.getContext('2d'); //set the canvas to render in 2d.
		setCanvasPos(); //get canvas position and size info
		GameLoop(); //run the game loop!

	};
	
	var SetHud = function(size, font, color) {
	  Settings.HudSize = size;
	  Settings.HudFont = font;
	  Settings.HudColor = color;
	};
	
	var CreateFrame = function(name, page, x, y, w, h, tabs, border, border_color) {
		Pages[page].Frames[name] = {
			x:x,
			y:y,
			w:w,
			h:h,
			border: (border || border == null ? true : false),
			border_color: (border_color ? border_color : "gray"),
			Pages: new Array(),
			CurPage: null,
			ShowTabs: (tabs === true ? true : false)
		};
	};
	
	var GetFrameParent = function(frame) {
		for (var pg in Pages) {
			if (Pages[pg].Frames[frame] != null) {
				return pg;
			}
		}
		return false;
	};
	
	var CreatePage = function(name, frame) {
		if (frame != null) {
			var frmParent = GetFrameParent(frame);
			if (frmParent === false) {
				console.log("Frame '" + frame + "' not found, create the frame before adding pages to it.");
				return;
			} else {
				Pages[frmParent].Frames[frame].Pages.push(name);
			}
		}
		Pages[name] = {
			Parent: (frame == null ? null : frame),
			Particles: new Array(),
			Buttons: {},
			Upgrades: {},
			Frames: {}
		};
	};
	
	var ShowPage = function(name) {
		if (Pages[name].Parent != null) {
			var root = GetFrameParent(Pages[name].Parent);
			Pages[root].Frames[Pages[name].Parent].CurPage = name;
		} else {
			Player.CurPage = name;
		}
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
	
	//Increment a currency according to it's PerClick rate
	var ClickCurrency = function(curn) {
	  Player.Clicks++; //add a click
	  IncCurrency(curn, Player.Currency[curn].PerClick);
	};
	
	//Increment a currency by a set amount
	var IncCurrency = function(curn, amt) { //the new coin adding function
		Player.Currency[curn].Count += amt; //increase coins by amount
	};
	
	//
	var DecCurrency = function(curn, amt) {
	  if (Player.Currency[curn].Count >= amt ) {
	    Player.Currency[curn].Count -= amt;
	    return true;
	  } else {
	    return false;
	  }
	};
	
	//check if the player has enough of multiple currencies at once
	//if they do, then decrement them and return "true"
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
	
	var achievementTimer = function() {
		Timers.Achievements = setInterval(function() { //set the Timer as an interval
 			CheckAchievements();
		}, 1000);
	};
	
	var CheckAchievements = function() {
		for (var a in Achievements) { //loop through each achievement in the object
		  if (Achievements[a].Get !== true) { //if not already earned this achievement
  			if (Achievements[a].Condition()) { //check the achievement condition
  			  Achievements[a].Get = true;
  				SetStatus("ACHIEVEMENT! " + Achievements[a].Name); //show message with achievement name
  				if (Achievements[a].Callback) {
  				  Achievements[a].Callback(); //call the achievement code, if it exists
  				}
  			}
		  }
		}
	};
	
	var BuyUpgrade = function(upgrd, page) {
		var up = Pages[page].Upgrades[upgrd];
		if (up.Get !== true) { //if not already purchased
		  if (MultiDecCurrency(up.Cost)) { //check if the player can afford it
		    up.Get = true; //set to purchased
		    up.Callback(); //call the upgrade code
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
		window.localStorage.setItem("eiEngine-info", JSON.stringify(Info));
		window.localStorage.setItem("eiEngine-settings", JSON.stringify(Settings));
		window.localStorage.setItem("eiEngine-player", JSON.stringify(Player));
		window.localStorage.setItem("eiEngine-achievements", JSON.stringify(Achievements));
		window.localStorage.setItem("eiEngine-pages", JSON.stringify(Pages));
		SetStatus("Saved!"); //show status message
	};
	
	var Load = function() { //load function
		if (window.localStorage.getItem("eiEngine-info")) {
			var version = JSON.parse(window.localStorage.getItem("eiEngine-info"));
			if (version.Version <= Info.Version) {
			  $.extend(true,Settings, JSON.parse(window.localStorage.getItem("eiEngine-settings")));
				$.extend(true,Player, JSON.parse(window.localStorage.getItem("eiEngine-player")));
				$.extend(true,Achievements, JSON.parse(window.localStorage.getItem("eiEngine-achievements")));
				$.extend(true,Pages, JSON.parse(window.localStorage.getItem("eiEngine-pages")));
				Save(); //resave the new versioned data
				Info = JSON.parse(window.localStorage.getItem("eiEngine-info"));
				SetStatus("Loaded!"); //show status message
			} else if (version.Version > Info.Version) {
				SetStatus("ERROR: Your save file is newer than the game, please reset."); //How the heck did that happen?
			}
		} else {
			SetStatus("No save game found."); //no save game
		}
	};
	
	var Reset = function() { //delete save function
		var areYouSure = confirm("Are you sure?\r\nYOU WILL LOSE YOUR SAVE!!"); //make sure the user is aware
		if (areYouSure == true) { //if they click ok
			window.localStorage.removeItem("eiEngine-info"); //delete
			window.localStorage.removeItem("eiEngine-settings"); //delete
			window.localStorage.removeItem("eiEngine-player"); //delete
			window.localStorage.removeItem("eiEngine-achievements"); //delete
			window.localStorage.removeItem("eiEngine-pages"); //delete
			window.location.reload(); //refresh page to restart
		}
	};

	/** event handlers **/
	var StartIncrement = function() { //automatic currency increment
		Timers.Increment = setInterval(function() { //set the Timer as an interval
		  for (var curn in Player.Currency) {
			  IncCurrency(curn, Player.Currency[curn].PerSec);
			}
		}, 1000);
	};
	
	//Initialize the auto-save timer
	var StartAutoSave = function() {
	  Timers.SaveGame = setInterval(function () {
	    Save();
	  }, Settings.SaveInterval * 1000);
	};
	
	//adjust mouse position relative to the Canvas position and size, not the page
	var getCanvasPos = function(canvas, evt) {
	  return {
	    X: Math.round((evt.clientX-Canvas.Rect.left)/(Canvas.Rect.right-Canvas.Rect.left)*Canvas.width),
			Y: Math.round((evt.clientY-Canvas.Rect.top)/(Canvas.Rect.bottom-Canvas.Rect.top)*Canvas.height)
	  };
	};
	
	//Re-get canvas size and position, called on resize
	var setCanvasPos = function() {
		Canvas.Rect = Canvas.getBoundingClientRect();
	};
	
	//sets the currently hovered button
	var setCurButton = function(name, page, upgrade) {
		if (upgrade !== true) {
			if (Player.CurButton !== null && Player.CurButton != name && Player.CurButtonPg != page) {
				Pages[Player.CurButtonPg].Buttons[Player.CurButton].Clicked = false;
			}
			Player.CurButton = name;
			Player.CurButtonPg = page;
			if (name !== null && Player.MouseDown == true) {
				Pages[page].Buttons[name].Clicked = true;
			}
		} else {
			if (Player.CurUpgrade !== null && Player.CurUpgrade != name && Player.CurUpgradePg != page) {
				Pages[Player.CurUpgradePg].Upgrades[Player.CurUpgrade].Clicked = false;
			}
			Player.CurUpgrade = name;
			Player.CurUpgradePg = page;
			if (name !== null && Player.MouseDown == true) {
				Pages[page].Upgrades[name].Clicked = true;
			}
		}
	};
	
	//tracking of hover events
	var hoverPageButtons = function(evt, page, oX, oY) {
		var offX = (oX ? oX : 0);
		var offY = (oY ? oY : 0);

		// Recursively call for all frames and pages
		for (var fr in Pages[page].Frames) {
			if (Pages[page].Frames[fr].CurPage) {
				hoverPageButtons(evt, Pages[page].Frames[fr].CurPage, offX + Pages[page].Frames[fr].x, offY + Pages[page].Frames[fr].y + (Pages[page].Frames[fr].ShowTabs ? Settings.FrameTabs.TabHeight : 0));
			}
		}
		
		// Check mouse position against buttons on this page
	  for (var n in Pages[page].Buttons) {
	    if (Pages[page].Buttons[n].Callback) {
        if (evt.X >= Pages[page].Buttons[n].x + offX && evt.X <= (Pages[page].Buttons[n].x + Pages[page].Buttons[n].w + offX) && evt.Y >= Pages[page].Buttons[n].y + offY && evt.Y <= (Pages[page].Buttons[n].y + Pages[page].Buttons[n].h + offY)) {
          setCurButton(n, page);
          return false;
        }
	    }
	  }

	  //check mouse position against upgrades on this page
	 	var upOffset = 0;
		for (var u in Pages[page].Upgrades) {
		  var curUp = Pages[page].Upgrades[u];
		  if (Settings.ShowPurchased == true || curUp.Get !== true) {
        if (evt.X >= Settings.UpgradeLocation[0] + offX && evt.X <= (Settings.UpgradeLocation[0] + Settings.UpgradeSize[0] + offX) && evt.Y >= (Settings.UpgradeLocation[1] + upOffset + offY) && evt.Y <= (Settings.UpgradeLocation[1] + Settings.UpgradeSize[1] + upOffset + offY)) {
        	if (curUp.Get !== true) {
          	setCurButton(u, page, true);
        	}
          return false;
        }
        upOffset += Settings.UpgradeSize[1] + 8;
		  }
		}
		
	};
	
	var AddClick = function() { 
		$(Canvas).on('click', function(evt) { 
			//Click event deprecated in favor of triggering on mouseup
			return false;
		}).mousemove(function(evt) { // Track mouse cursor to handle hover effects

			//Reset button status each frame, so only one is being hovered
			//(Must go here, not in recursive function)
			setCurButton(null);		
			setCurButton(null, null, true);
			hoverPageButtons(getCanvasPos(Canvas, evt), Player.CurPage);

			return false;
		});
		
		$(window).resize(function() { //Get canvas size and position on window resize
			setCanvasPos();
		}).on('mousedown', function(evt) { //watch for mouse down events anywhere
			Player.MouseDown = true;
			if (Player.CurButton) {
				Pages[Player.CurButtonPg].Buttons[Player.CurButton].Clicked = true;
			} else if (Player.CurUpgrade) {
				Pages[Player.CurUpgradePg].Upgrades[Player.CurUpgrade].Clicked = true;
			}
			return false;
		}).on('mouseup', function(evt) { // watch for mouse up events anywhere
			Player.MouseDown = false;
			if (Player.CurButton) {
				Pages[Player.CurButtonPg].Buttons[Player.CurButton].Clicked = false;
				Pages[Player.CurButtonPg].Buttons[Player.CurButton].Callback();
			} else if (Player.CurUpgrade) {
				Pages[Player.CurUpgradePg].Upgrades[Player.CurUpgrade].Clicked = false;
				BuyUpgrade(Player.CurUpgrade, Player.CurUpgradePg);
			}
			
			//check mouse position against any frame tabs on this page
			evt = getCanvasPos(Canvas, evt);
			var page = Player.CurPage;
			for (var cFrm in Pages[page].Frames) {
				if (Pages[page].Frames[cFrm].ShowTabs === true ) {
					var curFrm = Pages[page].Frames[cFrm];
					//console.log(evt.X + " <= " + curFrm.x + curFrm.w);
					if (evt.X >= curFrm.x && evt.X <= (curFrm.x + curFrm.w) && evt.Y >= curFrm.y && evt.Y <= (curFrm.y + Settings.FrameTabs.TabHeight)) {
						var tabSize = curFrm.w / curFrm.Pages.length;
						var tabNum = Math.floor((evt.X - curFrm.x) / tabSize);
						ShowPage(curFrm.Pages[tabNum]);
					}
				}
			}
			return false;
		});
	};

	/** animation routines **/
	var updateParticles = function(page) {
		for (var p = 0; p < Pages[page].Particles.length; p++) { //loop through particles
			Pages[page].Particles[p].y--; //move up by 1px
			Pages[page].Particles[p].o -= 0.1; //reduce opacity by 0.1
			if (Pages[page].Particles[p].o <= 0.0) { //if it's invisible
				Pages[page].Particles.splice(p,1); //remove the particle from the array
			}
		}
	};
	
	var recurseParticles = function(page) {
		for (var fr in Pages[page].Frames) {
			recurseParticles(Pages[page].Frames[fr].CurPage);
		}
		updateParticles(page);
	};

	var Update = function() { //update game objects

		recurseParticles(Player.CurPage);

		Draw(); //call the canvas draw function
	};
	
	
	/** Render Game **/
	
	var RenderPages = function(page) {
		
		//render upgrade buttons
		var upOffset = 0;
		for (var u in Pages[page].Upgrades) {
		  var curUp = Pages[page].Upgrades[u];
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
		    strCost = "(" + strCost + ")";
		    RenderText(
		        strCost,
		        Settings.UpgradeLocation[0] + (curUp.Clicked ? 3 : 0),
		        Settings.UpgradeLocation[1] + upOffset + (curUp.Clicked ? 2 : 0) - 4,
		        "Verdana",
		        curUp.text_size - 2,
		        curUp.text_color,
		        1,
		        Settings.UpgradeSize[0] - (curUp.Clicked ? 4 : 0),
		        Settings.UpgradeSize[1],
		        "center",
		        "bottom"
		      );
		    upOffset += Settings.UpgradeSize[1] + 8;
		  }
		}

		//Render Buttons from Object
    for (var btn in Pages[page].Buttons) {
      RenderButton(Pages[page].Buttons[btn]);
    }

		/** Render Frames **/
		
		for (var frm in Pages[page].Frames) {
			var curFrm = Pages[page].Frames[frm];
			//Canvas.Context.measureText(text).width;
			Canvas.Context.clearRect(curFrm.x, curFrm.y + (curFrm.ShowTabs ? Settings.FrameTabs.TabHeight : 0), curFrm.w, curFrm.h - (curFrm.ShowTabs ? Settings.FrameTabs.TabHeight : 0));
			RenderRect(curFrm.x, curFrm.y + (curFrm.ShowTabs ? Settings.FrameTabs.TabHeight : 0), curFrm.w, curFrm.h - (curFrm.ShowTabs ? Settings.FrameTabs.TabHeight : 0), curFrm.border_color, (curFrm.border ? 1 : 0), false);
			if (curFrm.ShowTabs === true) {
				var tabOffset = 1;
				var tabW = (curFrm.w / curFrm.Pages.length) - Settings.FrameTabs.TabSpacing;
				for (var curTab in curFrm.Pages) {
			    RenderButton({
			      x: curFrm.x + tabOffset,
			      y: curFrm.y + (curFrm.Pages[curTab] == curFrm.CurPage ? 1 : -1),
			      w: tabW,
			      h: Settings.FrameTabs.TabHeight,
			      color: (curFrm.CurPage == curFrm.Pages[curTab] ? Settings.FrameTabs.TabActive : Settings.FrameTabs.TabInactive),
			      opacity: 1,
			      text: curFrm.Pages[curTab],
			      text_font: "Verdana",
			      text_size: Settings.FrameTabs.text_size,
			      text_color: Settings.FrameTabs.text_color,
			      text_opacity: 1,
			      xAlign: "center",
			      yAlign: "center"
			    });
			    RenderRect(
			    	curFrm.x + tabOffset,
			    	curFrm.y + (curFrm.Pages[curTab] == curFrm.CurPage ? 1 : -1),
			    	tabW,
			    	Settings.FrameTabs.TabHeight,
			    	curFrm.border_color,
			    	(curFrm.border ? 1 : 0),
			    	false
			    );
			    tabOffset += tabW + Settings.FrameTabs.TabSpacing;
				}
			}
			//console.log(curFrm);
			if (curFrm.CurPage !== null) {
				//clip and translate the drawing area to the frame and call page render for the current page of that frame
				Canvas.Context.save();
				Canvas.Context.rect(curFrm.x, curFrm.y + (curFrm.ShowTabs ? Settings.FrameTabs.TabHeight : 0), curFrm.w, curFrm.h - (curFrm.ShowTabs ? Settings.FrameTabs.TabHeight : 0));
				Canvas.Context.clip();
				Canvas.Context.beginPath();
				Canvas.Context.translate(curFrm.x, curFrm.y + (curFrm.ShowTabs ? Settings.FrameTabs.TabHeight : 0));
				RenderPages(curFrm.CurPage);
				Canvas.Context.restore();
			}
		}
		
    /** particle rendering **/
		for (var p = 0; p < Pages[page].Particles.length; p++) {
      RenderText(Pages[page].Particles[p].chr, Pages[page].Particles[p].x + 1, Pages[page].Particles[p].y + 1, Settings.ParticleFont, Settings.ParticleSize, "black", Pages[page].Particles[p].o);
			RenderText(Pages[page].Particles[p].chr, Pages[page].Particles[p].x, Pages[page].Particles[p].y, Settings.ParticleFont, Settings.ParticleSize, Settings.ParticleColor, Pages[page].Particles[p].o);
		}
	}
	
	
	var Draw = function() {
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

		/** Call Page Drawing **/
		RenderPages(Player.CurPage);

    /** Display Status Message **/
    RenderText(StatusMessage, Settings.StatusLocation[0] + 1, Settings.StatusLocation[1] + 1, Settings.HudFont, Settings.HudSize, "black", 1); //new status message
		RenderText(StatusMessage, Settings.StatusLocation[0], Settings.StatusLocation[1], Settings.HudFont, Settings.HudSize, "orange", 1); //new status message

		GameLoop(); //trigger gameloop again
	};
	
	var GameRunning = null;
	var GameLoop = function() { //the gameloop function
		GameRunning = setTimeout(function() {
			window.requestAnimFrame(Update, Canvas);  //call animation frame
		}, 1);
	};

	/** drawing routines **/
	var RenderButton = function(btn) {
		var tbtn = {};
		$.extend(true, tbtn, btn);
		if (tbtn.Clicked == true) {
			tbtn.x += 3;
			tbtn.y += 2;
			tbtn.w -= 4;
			tbtn.h -= 3;
		}
    if (tbtn.image) {
      RenderImage(Images[tbtn.image].Image, tbtn.x, tbtn.y, tbtn.w, tbtn.h, tbtn.opacity);
    } else if(tbtn.color) {
      RenderRect(tbtn.x, tbtn.y, tbtn.w, tbtn.h, tbtn.color, tbtn.opacity, true);
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
	
	var RenderRect = function(x,y,w,h,col,opac, filled) { 
		if (col) { //check for color
			if (filled === true) {
				Canvas.Context.fillStyle = col; //set color
			} else {
				Canvas.Context.strokeStyle = col;
			}
		}
		if (opac >= 0) { //if opacity exists
			Canvas.Context.globalAlpha = opac; //set opacity
		}
		if (filled === true) {
			Canvas.Context.fillRect(x,y,w,h); //draw filled rectangle
		} else {
			Canvas.Context.strokeRect(x,y,w,h); //draw empty rectangle
		}
		Canvas.Context.globalAlpha = 1.0;
	};
	
	var RenderText = function(text,x,y,font,size,col,opac,w,h,centerX,centerY) {
		if (col) { //if there is a color
			Canvas.Context.fillStyle = col; //set color
		}
		if (opac > 0) { //if opacity exists
			Canvas.Context.globalAlpha = opac; //set opacity
		}
		Canvas.Context.font = size + "px " + font; //set font style
		var textW;
		if (centerX == "center" && w) {
		  textW = Canvas.Context.measureText(text).width;
		  x = x + ((w/2) - (textW/2));
		} else if (centerX == "left" && w) {
		  x = x + (w * 0.5);
		} else if (centerX == "right" && w) {
		  textW = Canvas.Context.measureText(text).width;
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
		CreateFrame: CreateFrame,
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

/** This is a request animation frame function that gets the best possible animation process for your browser, 
I won't go into specifics; just know it's worth using ;) **/
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

