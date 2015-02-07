//Create a new engine object, specifying the canvas size
var eiEngine = newEngine(800,600);

//** Images ** Add any images needed for the game
eiEngine.AddImage("Background1", "img/jungle.jpg"); //background image
eiEngine.AddImage("Coin", "img/coin.png"); //click area target
eiEngine.AddImage("ButtonBG", "img/menu-button.png"); // Button backgroun

//Set HUD font ----------------------------------------------------------------- (to be deprecated to displays !!!!)
eiEngine.SetHud(16,"Verdana","black");

//Create a game currency, these can be used to track anything
//These could also track producers, especially in cases where one producer creates another producer
eiEngine.CreateCurrency("Coins");

//Create a page to display objects on
//If no frame is specified it is assumed to use the whole canvas as the frame
eiEngine.CreatePage("Main");
//Set background image for the page Main
//eiEngine.SetBackground("Main", "Background1");

//Set the page to display
eiEngine.ShowPage("Main");

/** Buttons **/
eiEngine.CreateButton("ClickBox", "Main", //Button name (unique) and page to attach it to
  {
	  Image: "Coin", Opacity: 1, //image set to string of the correct key from the images object (above)
		x: 320, y: 180, //position (relative to it's parent frame!)
		w: 128, h: 128, //size
		xAlign: "center", yAlign: "bottom", //Alignment of text within the button
		Callback: function() { //callback function for click handling
		  //Creates a "particle" effect near the specified coordinates
      eiEngine.CreateParticle("Main", 350, 225, "+" + eiEngine.GetCurrency("Coins", "PerClick"));
      //call coin increase - increases given currency by it's "PerClick" value.
			eiEngine.ClickCurrency("Coins"); 
		}
	});
eiEngine.CreateButton("ClickText", "Main",
  {
	  Text: "Click Here", TextFont: "Verdana", TextSize: 27, TextColor: "black", TextOpacity: 1,
		x: 320, y: 260, 
		w: 128, h: 128 
  });
eiEngine.CreateButton("ShowPurchased", "Main",
  {
    Image: "ButtonBG", Opacity: 1,
    Text: "Hide Purchased", TextFont: "Verdana", TextSize: 14, TextColor: "white", TextOpacity:1,
    x: 650, y:550,
    w: 140, h:40,
      //Example callback for a toggle button that changes it's own text
    Callback: function () {
      eiEngine.SetSetting("ShowPurchased", !eiEngine.GetSetting("ShowPurchased"));
      if (eiEngine.GetSetting("ShowPurchased")) {
        eiEngine.AlterButton("ShowPurchased", "Main", {Text: "Hide Purchased"});
      } else {
        eiEngine.AlterButton("ShowPurchased", "Main", {Text: "Show Purchased"});
      }
    }
  });


	/** achievements **/
eiEngine.CreateAchievement("SmClick", //System name for the achievement, unique
  {
	  Name: "Small Clicker", //Display name
	  Desc: "Click 5 times", //Optional description text
	  //Condition that must be met for the achievement to be awarded, function must return true/false
	  Condition: function() { if (eiEngine.GetPlayer("Clicks") >= 5) {return true;} }
	});
eiEngine.CreateAchievement("MedClick",
  {
	  Name: "Medium Clicker",
	  Desc: "Click 10 times",
	  Condition: function() { if (eiEngine.GetPlayer("Clicks") >= 10) {return true;} }
	});
eiEngine.CreateAchievement("LgClick",
  {
	  Name: "Large Clicker",
	  Desc: "Click 20 times",
	  Condition: function() { if (eiEngine.GetPlayer("Clicks") >= 20) {return true;} },
	  //Callback function on achievements is called when they are awarded, used to give a reward, optional
	  Callback: function() { eiEngine.IncCurrency("Coins", 50); }
	});
eiEngine.CreateAchievement("Richer",
  {
	  Name: "Richer",
	  Desc: "Collect 75 coins",
	  Condition: function() { if (eiEngine.GetCurrency("Coins", "Count") >= 75) {return true;} },
	  Callback: function() { eiEngine.IncCurrency("Coins", 50); }
	});
eiEngine.CreateAchievement("Recursive",
  {
    Name: "Recursive",
    Desc: "Collect 300 coins",
    Condition: function() { if (eiEngine.GetCurrency("Coins", "Count") >= 300) {return true;} },
    Callback: function() { eiEngine.AlterCurrency("Coins", "PerSec", +2); }
  });


	/** upgrades **/
	
//Create the "Sidebar" frame, attach the frame to page "Main", then x, y, w, h, ShowTabs
eiEngine.CreateFrame("Sidebar", "Main", 630, 10, 160, 300, true);

//Create the upgrades page and attach it to the sidebar frame
eiEngine.CreatePage("Upgrades", "Sidebar");
//Set the upgrades page to be shown (it knows what frame it's attached to already)
eiEngine.ShowPage("Upgrades");

//misc upgrades settings ------------------------------------------------------- (to be deprecated to groups !!!!)
eiEngine.SetSetting("ShowPurchased", true, "UpgradeLocation", [10, 10], "UpgradeSize", [140,40]);

//Not actually a button, just header text
//Buttons without a "callback" aren't compared against mouse coordinates, so are very light
/*
eiEngine.CreateButton("UpgdText", "Upgrades",
  {
	  text: "Upgrades:", text_font: "Verdana", text_size: 20, text_color: "black", text_opacity: 1,
		x: 10, y: 8, //position
		w: 140, h: 24 //size
  });
*/

//Add an upgrade to the Upgrades page
eiEngine.CreateUpgrade("ClickUp1", "Upgrades",
  {
    Text: "+1 per Click", TextFont: "Verdana", TextSize: 12, TextColor: "black", TextOpacity: 1,
    Desc: "More coins for each click!",
    Cost: [["Coins",10]], //Cost for upgrades supplied in a 2d array, allows for multiple purchase costs
    Callback: function() {
      eiEngine.AlterCurrency("Coins", "PerClick", +1);
      //As part of it's action, the ClickUp1 upgrade creates another available upgrade when it is purchased
      //this sets up a chain of required upgrades, if this chain gets long, it would be better to refer to an outside function
      eiEngine.CreateUpgrade("ClickUp2", "Upgrades",
      {
        Text: "+2 per Click", TextFont: "Verdana", TextSize: 12, TextColor: "black", TextOpacity: 1,
        Desc: "Yet more coins for each click.",
        Cost: [["Coins",75]],
        Callback: function() {
          eiEngine.AlterCurrency("Coins", "PerClick", +2);
        }
      });
    }
  });
  
//A second initial upgrade with chained successors via callback
eiEngine.CreateUpgrade("IncUp1", "Upgrades",
{
  Text: "+1 per second", TextFont: "Verdana", TextSize: 12, TextColor: "black", TextOpacity: 1,
  Desc: "Coins for nothing!",
  Cost: [["Coins",50]],
  Callback: function() {
     eiEngine.AlterCurrency("Coins", "PerSec", +1);
     eiEngine.CreateUpgrade("IncUp2", "Upgrades",
     {
       Text: "+2 per second", TextFont: "Verdana", TextSize: 12, TextColor: "black", TextOpacity: 1,
       Desc: "More free coins!",
       Cost: [["Coins",150]],
       Callback: function() {
         eiEngine.AlterCurrency("Coins", "PerSec", +2);
         eiEngine.CreateUpgrade("EndGame", "Upgrades",
         {
	       Text: "Woohoo!", TextFont: "Verdana", TextSize: 12, TextColor: "black", TextOpacity: 1,
	       Desc: "You won the game!",
	       Cost: [["Coins",450]],
	       Callback: function() {
             alert("Congratulations, you won!\r\nIt only took you " + eiEngine.GetPlayer("Clicks") + " clicks!");
             eiEngine.Reset();
           }
         });
       }
     });
   }
});

//Create a second test page, to show off frame tabs
eiEngine.CreatePage("Data", "Sidebar");

eiEngine.CreateButton("Save", "Data",
	{
	  Image: "ButtonBG", Opacity: 1,
	  Text: "Save", TextFont: "Verdana", TextSize: 14, TextColor: "white", TextOpacity: 1,
		x: 10, y: 10, 
		w: 140, h: 40, 
		Callback: function () { eiEngine.Save(); }
	});
eiEngine.CreateButton("Reset", "Data",
	{
	  Image: "ButtonBG", Opacity: 1,
	  Text: "Reset", TextFont: "Verdana", TextSize: 14, TextColor: "white", TextOpacity: 1,
		x: 10, y: 60, 
		w: 140, h: 40, 
		Callback: function () { eiEngine.Reset(); }
	});

//After everything is added and window loads, initialize the engine
window.onload = eiEngine.Init();
