var eiEngine = newEngine(800,600);

/** Images **/
eiEngine.AddImage("Background1", "img/jungle.jpg"); //background image
eiEngine.AddImage("ClickArea", "img/coin.png"); //click area target

eiEngine.SetBackground("Background1");
eiEngine.SetHud(16,"Verdana","white");

eiEngine.CreateCurrency("Coins");

eiEngine.CreatePage("Main");
eiEngine.ShowPage("Main");

/** Buttons **/
eiEngine.CreateButton("ClickBox", "Main",
  {
	  image: "ClickArea", opacity: 1, //image set to string of the correct key from the images object (above)
		x: 320, y: 180, //position
		w: 128, h: 128, //size
		yAlign: "bottom",
		Callback: function() { //callback function for click handling
      eiEngine.CreateParticle("Main", 350, 225);
			eiEngine.ClickCurrency("Coins"); //call coin increase
		}
	});
eiEngine.CreateButton("ClickText", "Main",
  {
	  text: "Click Here", text_font: "Verdana", text_size: 27, text_color: "white", text_opacity: 1,
		x: 320, y: 260, //position
		w: 128, h: 128 //size
  });
eiEngine.CreateButton("Save", "Main",
	{
	  text: "Save", text_font: "Verdana", text_size: 14, text_color: "#111", text_opacity: 1,
	  color: "silver", opacity: 0.9,
		x: 16, y: 510, //position
		w: 100, h: 32,  //size
		Callback: function () { eiEngine.Save(); }
	});
eiEngine.CreateButton("Reset", "Main",
	{
	  text: "Reset", text_font: "Verdana", text_size: 14, text_color: "#111", text_opacity: 1,
	  color: "silver", opacity: 0.9,
		x: 16, y: 550, //position
		w: 100, h: 32,  //size
		Callback: function () { eiEngine.Reset(); }
	});
eiEngine.CreateButton("ShowPurchased", "Main",
  {
    text: "Hide Purchased", text_font: "Verdana", text_size: 14, text_color: "black", text_opacity:1,
    color: "silver", opacity: 0.8,
    x: 650, y:550,
    w: 140, h:32,
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


	/** upgrades **/
eiEngine.SetSetting("ShowPurchased", true, "UpgradeLocation", [650, 32], "UpgradeSize", [140,40]);

eiEngine.CreateUpgrade("ClickUp1", "Main",
  {
    Text: "+1 per Click",
    Desc: "More coins for each click!",
    Cost: [["Coins",10]],
    Callback: function() {
      eiEngine.AlterCurrency("Coins", "PerClick", +1);
      eiEngine.CreateUpgrade("ClickUp2", "Main",
      {
        Text: "+2 per Click",
        Desc: "Yet more coins for each click.",
        Cost: [["Coins",75]],
        Callback: function() {
          eiEngine.AlterCurrency("Coins", "PerClick", +2);
        }
      });
    }
  });
eiEngine.CreateUpgrade("IncUp1", "Main",
{
  Text: "+1 per second",
  Desc: "Coins for nothing!",
  Cost: [["Coins",50]],
  Callback: function() {
     eiEngine.AlterCurrency("Coins", "PerSec", +1);
     eiEngine.CreateUpgrade("IncUp2", "Main",
     {
       Text: "+2 per second",
       Desc: "More free coins!",
       Cost: [["Coins",150]],
       Callback: function() {
         eiEngine.AlterCurrency("Coins", "PerSec", +2);
         eiEngine.CreateUpgrade("EndGame", "Main",
         {
	       Text: "Woohoo!",
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
