# grid.js #
====

grid.js is a simple table grid jQuery plugin over [bootstrap](http://twitter.github.com/bootstrap/index.html). I just created it cuz i didn't like any grid plugin i tried and  didn't need most of the functionalities they had. 

## Characteristics ##
 * it's very lightweight, grid.js is 23k and grid.css is 2k unzipped.
 * it's very simple to setup and start.
 * it's based on bootstrap styles.
 * it's very easy to skin/style, it has just a css file ( grid.css )
 * it has pager functionality
 * no scroll for pages
 * 2 data types , array (static) , json (webservice).
 * A responsive mode , it hides columns depending on the windows size.
 * Sort functionality, for array data type it does everything in js , for json data type it just sends the info to the service.
 * it has a lot of params to personalize it  and most of them has the common behavior set by default.

## Simple start ##

	<html lang="en">
		<head>
   			<meta charset="utf-8">
			<link id="css-bootstrap" href="css/bootstrap.css" rel="stylesheet">
    		<link id="css-grid" href="css/grid.css" rel="stylesheet">
		</head>
		<body>
			<div class="container" >
				<div class="row" id="table-container"></div>
			</div>
		
			<script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
			<script type="text/javascript" src="js/bootstrap.js"></script>
			<script type="text/javascript" src="js/grid.js"></script>
			
			<script type="text/javascript" >
				(function($){
					$('div#table-container').grid();
				})(windows.jQuery);
			</script>
		</body>	
	</html>
