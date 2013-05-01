/* GLOBAL */
var allBookmarks = [];
var allHistories = [];
var siteRating = [];

var debug = false;
BIGINT = 1000000;
/*** GLOBAL ***/

/* API */
function getAllBookmarks(){
	chrome.bookmarks.getRecent(1000, function(bookmarks) {
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
			allHistories = historyItems
		})
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
	return allBookmarks.slice(0, 40);
}

function createHistorySiteRating(){
	allHistories.forEach(function(entry){
		dn = url_domain(entry.url);
		if(SHITLIST.indexOf(dn) >= 0){
			return;
		}
		if(siteRating[dn] == undefined ){
			siteRating[dn] = 1 * (entry.typedCount + entry.visitCount);
		}else{
			siteRating[dn] += 1 * (entry.typedCount + entry.visitCount);
		}
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
