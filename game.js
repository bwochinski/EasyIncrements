var eiEngine = newEngine(800,600);

/** Images **/
eiEngine.AddImage("Background1", "img/jungle.jpg"); //background image
eiEngine.AddImage("Coin", "img/coin.png"); //click area target
eiEngine.AddImage("ButtonBG", "img/menu-button.png"); // Button backgroun

//eiEngine.SetBackground("Background1");
eiEngine.SetHud(16,"Verdana","black");

eiEngine.CreateCurrency("Coins");

eiEngine.CreatePage("Main");
eiEngine.ShowPage("Main");

eiEngine.CreateFrame("Sidebar", "Main", 630, 10, 160, 300);

eiEngine.CreatePage("Upgrades", "Sidebar");
eiEngine.ShowPage("Upgrades");

/** Buttons **/
eiEngine.CreateButton("ClickBox", "Main",
  {
	  image: "Coin", opacity: 1, //image set to string of the correct key from the images object (above)
		x: 320, y: 180, //position
		w: 128, h: 128, //size
		yAlign: "bottom",
		Callback: function() { //callback function for click handling
      eiEngine.CreateParticle("Main", 350, 225, "+" + eiEngine.GetCurrency("Coins", "PerClick"));
			eiEngine.ClickCurrency("Coins"); //call coin increase
		}
	});
eiEngine.CreateButton("ClickText", "Main",
  {
	  text: "Click Here", text_font: "Verdana", text_size: 27, text_color: "black", text_opacity: 1,
		x: 320, y: 260, //position
		w: 128, h: 128 //size
  });
eiEngine.CreateButton("Save", "Main",
	{
	  image: "ButtonBG", opacity: 1,
	  text: "Save", text_font: "Verdana", text_size: 14, text_color: "white", text_opacity: 1,
		x: 16, y: 502, //position
		w: 140, h: 40,  //size
		Callback: function () { eiEngine.Save(); }
	});
eiEngine.CreateButton("Reset", "Main",
	{
	  image: "ButtonBG", opacity: 1,
	  text: "Reset", text_font: "Verdana", text_size: 14, text_color: "white", text_opacity: 1,
	  color: "silver",
		x: 16, y: 550, //position
		w: 140, h: 40,  //size
		Callback: function () { eiEngine.Reset(); }
	});
eiEngine.CreateButton("ShowPurchased", "Main",
  {
    image: "ButtonBG", opacity: 1,
    text: "Hide Purchased", text_font: "Verdana", text_size: 14, text_color: "white", text_opacity:1,
    x: 650, y:550,
    w: 140, h:40,
    Callback: function () {
      eiEngine.SetSetting("ShowPurchased", !eiEngine.GetSetting("ShowPurchased"));
      if (eiEngine.GetSetting("ShowPurchased")) {
        eiEngine.UpdateButton("ShowPurchased", "Main", {text: "Hide Purchased"});
      } else {
        eiEngine.UpdateButton("ShowPurchased", "Main", {text: "Show Purchased"});
      }
    }
  });


	/** achievements **/
eiEngine.CreateAchievement("SmClick",
  {
	  Name: "Small Clicker",
	  Desc: "Click 5 times",
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
eiEngine.SetSetting("ShowPurchased", true, "UpgradeLocation", [10, 32], "UpgradeSize", [140,40]);

//Not actually a button, just header text
//Buttons without a "callback" aren't compared against 
eiEngine.CreateButton("UpgdText", "Upgrades",
  {
	  text: "Upgrades:", text_font: "Verdana", text_size: 20, text_color: "black", text_opacity: 1,
		x: 10, y: 8, //position
		w: 140, h: 24 //size
  });

eiEngine.CreateUpgrade("ClickUp1", "Upgrades",
  {
    Text: "+1 per Click", text_font: "Verdana", text_size: 12, text_color: "black", text_opacity: 1,
    Desc: "More coins for each click!",
    Cost: [["Coins",10]],
    Callback: function() {
      eiEngine.AlterCurrency("Coins", "PerClick", +1);
      eiEngine.CreateUpgrade("ClickUp2", "Upgrades",
      {
        Text: "+2 per Click", text_font: "Verdana", text_size: 12, text_color: "black", text_opacity: 1,
        Desc: "Yet more coins for each click.",
        Cost: [["Coins",75]],
        Callback: function() {
          eiEngine.AlterCurrency("Coins", "PerClick", +2);
        }
      });
    }
  });
eiEngine.CreateUpgrade("IncUp1", "Upgrades",
{
  Text: "+1 per second", text_font: "Verdana", text_size: 12, text_color: "black", text_opacity: 1,
  Desc: "Coins for nothing!",
  Cost: [["Coins",50]],
  Callback: function() {
     eiEngine.AlterCurrency("Coins", "PerSec", +1);
     eiEngine.CreateUpgrade("IncUp2", "Upgrades",
     {
       Text: "+2 per second", text_font: "Verdana", text_size: 12, text_color: "black", text_opacity: 1,
       Desc: "More free coins!",
       Cost: [["Coins",150]],
       Callback: function() {
         eiEngine.AlterCurrency("Coins", "PerSec", +2);
         eiEngine.CreateUpgrade("EndGame", "Upgrades",
         {
	       Text: "Woohoo!", text_font: "Verdana", text_size: 12, text_color: "black", text_opacity: 1,
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


window.onload = eiEngine.Init(); //the engine starts when window loads
