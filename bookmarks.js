var allBookmarks = [];
var debug = true;

URL_REGEXP = /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/;

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

function renderBookmarkHtml(bookmark){
	html = new EJS({url:'ejs/bookmark.ejs'}).render(bookmark);
	if(debug){ console.debug(html); }
	return html;
}

function addAllBookmarksToPage(){
	allBookmarks.forEach(function(bookmark){
		$("#bookmarks")[0].innerHTML += renderBookmarkHtml( bookmark ) ;	
	}  );	
}

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

function perform(){
	getAllBookmarks();
	
	setInterval(runFirstTime,100);
	
	function runFirstTime(){
 	   if( checkPageElementExistsId("bookmarks") && isEmpty($("#bookmarks")[0]) ){
	   		addBookmarksToPage(bookmarksToAddFirstTime());
			running = true;	   
	   } 		
	}			
}

/* page managing helpers */
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
