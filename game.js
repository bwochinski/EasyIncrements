/** Images **/
Engine.AddImage("Background1", "img/jungle.jpg"); //background image
Engine.AddImage("ClickArea", "img/coin.png"); //click area target

Engine.SetBackground("Background1");
Engine.SetHud(16,"Verdana","white");

Engine.CreateCurrency("Coins");

Engine.CreatePage("Main");
Engine.ShowPage("Main");

/** Buttons **/
Engine.CreateButton("ClickBox", "Main",
  {
	  image: "ClickArea", opacity: 1, //image set to string of the correct key from the images object (above)
		x: 320, y: 180, //position
		w: 128, h: 128, //size
		yAlign: "bottom",
		Callback: function() { //callback function for click handling
    Engine.CreateParticle("Main", 350, 225);
			Engine.ClickCurrency("Coins"); //call coin increase
		}
	});
Engine.CreateButton("ClickText", "Main",
  {
	  text: "Click Here", text_font: "Verdana", text_size: 27, text_color: "white", text_opacity: 1,
		x: 320, y: 260, //position
		w: 128, h: 128 //size
  });
Engine.CreateButton("Save", "Main",
	{
	  text: "Save", text_font: "Verdana", text_size: 14, text_color: "#111", text_opacity: 1,
	  color: "silver", opacity: 0.9,
		x: 16, y: 510, //position
		w: 100, h: 32,  //size
		Callback: function () { Engine.Save(); }
	});
Engine.CreateButton("Reset", "Main",
	{
	  text: "Reset", text_font: "Verdana", text_size: 14, text_color: "#111", text_opacity: 1,
	  color: "silver", opacity: 0.9,
		x: 16, y: 550, //position
		w: 100, h: 32,  //size
		Callback: function () { Engine.Reset(); }
	});
Engine.CreateButton("ShowPurchased", "Main",
  {
    text: "Hide Purchased", text_font: "Verdana", text_size: 14, text_color: "black", text_opacity:1,
    color: "silver", opacity: 0.8,
    x: 650, y:550,
    w: 140, h:32,
    Callback: function () {
      Engine.Settings.ShowPurchased = !Engine.Settings.ShowPurchased;
      if (Engine.Settings.ShowPurchased) {
        Engine.Buttons.ShowPurchased.text = "Hide Purchased";
      } else {
        Engine.Buttons.ShowPurchased.text = "Show Purchased";
      }
    }
  });


	/** achievements **/
Engine.CreateAchievement("SmClick",
  {
	  Name: "Small Clicker",
	  Desc: "Click 5 times",
	  Condition: function() { if (Engine.Player.Clicks >= 5) {return true;} }
	});
Engine.CreateAchievement("MedClick",
  {
	  Name: "Medium Clicker",
	  Desc: "Click 10 times",
	  Condition: function() { if (Engine.Player.Clicks >= 10) {return true;} }
	});
Engine.CreateAchievement("LgClick",
  {
	  Name: "Large Clicker",
	  Desc: "Click 20 times",
	  Condition: function() { if (Engine.Player.Clicks >= 20) {return true;} },
	  Callback: function() { Engine.IncCurrency("Coins", 50); }
	});
Engine.CreateAchievement("Richer",
  {
	  Name: "Richer",
	  Desc: "Collect 75 coins",
	  Condition: function() { if (Engine.Player.Currency.Coins.Count >= 75) {return true;} },
	  Callback: function() { Engine.IncCurrency("Coins", 50); }
	});


	/** upgrades **/
Engine.Settings.ShowPurchased = true;
Engine.Settings.UpgradeLocation = [650, 32];
Engine.Settings.UpgradeSize = [140,40];

Engine.CreateUpgrade("ClickUp1", "Main",
  {
    Text: "+1 per Click",
    Desc: "More coins for each click!",
    Cost: [["Coins",10]],
    Callback: function() {
      Engine.Player.Currency.Coins.PerClick += 1;
      Engine.CreateUpgrade("ClickUp2", "Main",
      {
        Text: "+2 per Click",
        Desc: "Yet more coins for each click.",
        Cost: [["Coins",75]],
        Callback: function() {
          Engine.Player.Currency.Coins.PerClick += 2;
        }
      });
    }
  });
Engine.CreateUpgrade("IncUp1", "Main",
{
  Text: "+1 per second",
  Desc: "Coins for nothing!",
  Cost: [["Coins",50]],
  Callback: function() {
     Engine.Player.Currency.Coins.PerSec += 1;
     Engine.CreateUpgrade("IncUp2", "Main",
     {
       Text: "+2 per second",
       Desc: "More free coins!",
       Cost: [["Coins",150]],
       Callback: function() {
         Engine.Player.Currency.Coins.PerSec += 2;
         Engine.CreateUpgrade("EndGame", "Main",
         {
	       Text: "Woohoo!",
	       Desc: "You won the game!",
	       Cost: [["Coins",450]],
	       Callback: function() {
             alert("Congratulations, you won!\r\nIt only took you " + Engine.Player.Clicks + " clicks!");
             Engine.Reset();
           }
         });
       }
     });
   }
});


