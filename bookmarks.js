/* GLOBAL */
var allBookmarks = [];
var allHistories = [];
var siteRating = [];
var completeList = [];
var siteIcons = [];

var debug = false;
BIGINT = 1000000;
DEFAULT_BOOKMARKS_COUNT = 56;
DEFAULT_POPULAR_COUNT = 40;
/*** GLOBAL ***/

/* API */
function getAllBookmarks(){
	chrome.bookmarks.getRecent(BIGINT, function(bookmarks) {
	  getBookmarks(bookmarks);
	});	
}

function getBookmarks(bookmarks) {
  bookmarks.forEach(function(bookmark) {
	
    if (bookmark.children){
        getBookmarks(bookmark.children);
    }
	else{
		allBookmarks.push(bookmark);
	    
		if(debug){console.debug(bookmark.id + ' - ' + bookmark.title + ' - ' + bookmark.url);}
			
	}
  });
}

function getHistories(){	
	chrome.history.search({
	      'text': '',        
		  // get history for the last week
	      'startTime':  (new Date).getTime() - 1000 * 60 * 60 * 24 * 7, 
		  'maxResults': BIGINT  
	    },
	    function(historyItems) {
			allHistories = historyItems;
		})
}

/* Functions from sample app  */

function compare(a, b) {
  return (a > b) ? 1 : (a == b ? 0 : -1);
}

function compareByName(app1, app2) {
	return compare(app1.name.toLowerCase(), app2.name.toLowerCase());
}

function getAllApps(){
    chrome.management.getAll(function(info) {
     	var appCount = 0;
      	for (var i = 0; i < info.length; i++) {
        	if (info[i].isApp) {
          		appCount++;
        		completeList.push(info[i]);
			}
      	}
      	if (appCount == 0) {
        	$('search').style.display = 'none';
        	$('appstore_link').style.display = '';
        	return;
      	}
    	completeList = completeList.sort(compareByName);
	}) 
}  	
	
function getIconURL(app) {
  	if (!app.icons || app.icons.length == 0) {
  	  return chrome.extension.getURL('icon.png');
  	}
  	var largest = {size:0};
  	for (var i = 0; i < app.icons.length; i++) {
    	var icon = app.icons[i];
   		if (icon.size > largest.size) {
   			largest = icon;
    	}
  	}
 	return largest.url;
}

function launchApp(id) {
	chrome.management.launchApp(id);
 	window.close(); // Only needed on OSX because of crbug.com/63594
}
	
/*** API ***/
/* LOGIC */
function addBookmarkToPage(bookmark){
	$("#bookmarks")[0].innerHTML += renderBookmarkHtml( bookmark ) ;

	
	$("#" +  bookmark.id).mouseover(function() {
	  $("#" ).load(this.href);
	});
	
}

function addBookmarksToPage(bookmarks){
	bookmarks.forEach(function(bookmark){
		addBookmarkToPage(bookmark);
	});		
}
	
function bookmarksToAddFirstTime(){
	return allBookmarks.slice(0, DEFAULT_BOOKMARKS_COUNT);
}

function createHistorySiteRating(){
	allHistories.forEach(function(entry){
		dn = url_domain_and_http_type(entry.url);
		if(SHITLIST.indexOf(url_domain(dn)) >= 0){
			return;
		}
		if(siteRating[dn] == undefined ){
			siteRating[dn] = 1 * (entry.typedCount + entry.visitCount);
		}else{
			siteRating[dn] += 1 * (entry.typedCount + entry.visitCount);
		}
		siteIcons[url_domain(dn)] = entry.url;
	})
	siteRating = sortDictByValue(siteRating).reverse();
}

function sortDictByValue(dict){
	var sortable = [];
	for (var key in dict)
	      sortable.push([key, dict[key]])
	
	sortable.sort(function(a, b) {return a[1] - b[1]});
	return sortable;	
}
// hack 
function url_domain(data) {
  	var    a      = document.createElement('a');
           a.href = data;
    return a.hostname;
}

function url_domain_and_http_type(data) {
    urlDomain = url_domain(data);
	if(data.indexOf("https") >= 0){
		return "https://" + urlDomain; 
	}else{
		return "http://" + urlDomain; 
	}
  
}

function perform(){
	getAllBookmarks();
	getHistories();
	
	setInterval(runFirstTime,100);
	
	function runFirstTime(){
 	   if( checkPageElementExistsId("bookmarks") && isEmpty($("#bookmarks")[0]) ){
	   		addBookmarksToPage(bookmarksToAddFirstTime());
	   } 		
	   if(siteRating[0] == undefined){
	   	    // TODO:improve.
	   	    // potentially slow	
		    createHistorySiteRating();
	   }
		
	   if( checkPageElementExistsId("popular") && isEmpty( $("#popular")[0] ) && siteRating[0] != undefined ){
	   		addPopularToPage();
	   }	   
	}
	
}

/*** LOGIC ***/

/* page managing helpers */
function addAllBookmarksToPage(){
	allBookmarks.forEach(function(bookmark){
		$("#bookmarks")[0].innerHTML += renderBookmarkHtml( bookmark ) ;	
	}  );	
}

function renderBookmarkHtml(bookmark){
	html = new EJS({url:'ejs/bookmark.ejs'}).render(bookmark);
	if(debug){ console.debug(html); }
	return html;
}

function addPopularToPage(){
	$("#popular")[0].innerHTML += renderHistoriesHtml();	
	
}
function renderHistoriesHtml(){
	html = new EJS({url:'ejs/popular.ejs'}).render([]);
	if(debug){ console.debug(html); }
	return html;
}

function checkPageElementExistsId(elementId){
	return document.getElementById(elementId) ? true : false; 
}

function isEmpty(htmlDomElelment){
	return htmlDomElelment.innerHTML == "";
}

/**/
window.onload = function() {
	perform();
};
