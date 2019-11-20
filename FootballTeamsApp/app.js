// the API url
const api = 'https://www.thesportsdb.com/api/v1/json/1/search_all_teams.php?l=';

//URL's for the different football leagues API
var leagueMap = {
  epl: 'English%20Premier%20League',
  bundesliga: 'German%20Bundesliga',
  serieA: 'Italian%20Serie%20A',
  ligue1: 'French%20Ligue%201',
  laLiga: 'Spanish%20La%20Liga',
  mls: 'American%20Major%20League%20Soccer',
  aus: 'Australian%20A-League',
}

//getter for the league APIs
function getLeague(leagueKey) {
  return leagueMap[leagueKey];
}

//the displayed league is EPL by default
var currentLeague = leagueMap["epl"];

//create an html heading or paragraph (text element)
function createTextElm(type, text) {
  var elm = document.createElement(type);
  var t = document.createTextNode(text);
  elm.appendChild(t);
  return elm;
}

//create a div containing a heading, an img and an optional paragraph
function createDisplayBox(headingText, imgSource, paragraphText) {
  //div container that will append all the elements passed
  var div = document.createElement("div");

  var elm = createTextElm("h", headingText);
  div.appendChild(elm);

  elm = document.createElement("img");
  elm.setAttribute("src", imgSource);
  div.appendChild(elm);

  //if no paragraphText is passed - return the div
  if (paragraphText === null) {
    return div;
  } else {
    elm = createTextElm("p", paragraphText);
    div.appendChild(elm);
    return div;
  }
}

//clear previously searched team
function clearSearchTeam() {
  //div containers for the search team
  var nb = document.getElementById("nameNbadge");
  var sd = document.getElementById("stadNdesc");
  var yk = document.getElementById("yearNkit");
  
  //clear the containers if they are not empty
  //if one is empty - all of them are
  if (nb.hasChildNodes()) {
    nb.removeChild(nb.firstChild);
    sd.removeChild(sd.firstChild);
    yk.removeChild(yk.firstChild);
  }

  return [nb, sd, yk];
}

//display information about a searched team
function displayTeam(name, badgeImg, formed, kitImg, stadium, stadiumImg, desc) {
  //will return the empty div containers for a search team
  var divs = clearSearchTeam();

  //div1 for name and badge
  var childDiv = createDisplayBox(name, badgeImg, null);
  divs[0].appendChild(childDiv);

  //div2 for stadium and team description
  childDiv = createDisplayBox("Stadium: " + stadium, stadiumImg, desc);
  divs[1].appendChild(childDiv);
  
  //div3 for founded and kit
  childDiv = createDisplayBox("Formed: " + formed, kitImg, null);
  divs[2].appendChild(childDiv);
}

//search with enter key press
function enterSearch(e) {
  if (e.keyCode === 13) {
    getTeamInfo();
  }
}

//fetch the searched team information from the api
function getTeamInfo() {
  //when the search button is clicked, it passes no searchTeam so we take whatever is in the input field
  var input = document.getElementById("input").value.toLowerCase();
  document.getElementById("input").value = "";

  var apiRequest = api + currentLeague;

  fetch(apiRequest)
  .then(response => {
    return response.json()
  })  
  .then(data => {
    var i = 0;
    while (i<20) {
      //will check both the full name and the alternative (often short) name
      var name1 = data.teams[i].strTeam.toLowerCase();
      var name2 = data.teams[i].strAlternate.toLowerCase();
      //enables search from incomplete input, e.g. searching for "liv" in the EPL will return "Liverpool"
      if (name1.includes(input) || name2.includes(input)) {
        break;
      }
      i++;
    }
    var team = data.teams[i];

    //display information about the searched team
    displayTeam(team.strTeam, team.strTeamBadge, team.intFormedYear, team.strTeamJersey,
                team.strStadium, team.strStadiumThumb, team.strDescriptionEN);
  })
  .catch(err => {
    console.log(err);
  });
}

//fetch information about selected league and display a list of teams
function loadTeamList(displayLeague, displayElement) {
  var apiRequest = api + displayLeague;
  //fetch selected API
  fetch(apiRequest)
  .then(response => {
      return response.json()
    })
    .then(data => {
      //create the list with the teams from selected league
      //each team is represented by a div element that consist of name, picture and short description
      var i = 0;
      while (i<data.teams.length) {
        var team = data.teams[i];
        //the picture will be either the badge or the kits
        var pic = (displayElement === "b") ? team.strTeamBadge : team.strTeamJersey;
        //create display box
        var teamDiv = createDisplayBox(team.strTeam, pic, team.strDescriptionEN.substring(0, 149) + "...");
        //append the teamDiv
        document.getElementById("teams").appendChild(teamDiv);
        i++;
      }
    })
    .catch(err => {
      console.log(err);
  });
}

//change the view of the club list - picture the badge or the kit
var badgeClicked = true;
function changeView(id) {
  //check if button is already clicked
  if (id === "bdg" && !badgeClicked) {
    badgeClicked = true;
    //clear the current list
    var parent = document.getElementById("teams");
    while (parent.hasChildNodes()){
      parent.removeChild(parent.firstChild);
    }
    //load teams with "b" for badge
    loadTeamList(currentLeague, "b"); 

  } else if (id === "kit" && badgeClicked) {
    badgeClicked = false;

    var parent = document.getElementById("teams");
    while (parent.hasChildNodes()){
      parent.removeChild(parent.firstChild);
    }
    //load teams with kits
    //kits are now associated with whatever since it's either badge or kit, however, more can be added
    loadTeamList(currentLeague, "");
  }
}

//change the league
function changeLeague(id) {
  clearSearchTeam();

  //check if the league exists in the map
  if (id in leagueMap) {
    var l = leagueMap[id];
    //only change if a league different than the current one is selected
    if (l !== currentLeague) {
      //clear the current list of teams
      var parent = document.getElementById("teams");
      while (parent.hasChildNodes()){
        parent.removeChild(parent.firstChild);
      }
      //load the teams with the new league
      loadTeamList(l, "b");
      //update the current league
      currentLeague = l;
    }
  }
}

//load the default league on page load
loadTeamList(currentLeague, "b");