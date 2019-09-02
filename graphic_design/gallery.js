let folder = "https://github.com/unodeej/unodeej.github.io/tree/master/graphic_design/img/comics"; //TODO: change this to the path to your folder with the images.
$.ajax({
	url: folder,
	success: function(data) {
		$(data).find("a").attr("href", function(i, val) {
			$("body").append("<img src='" + folder + '/' + val + "'>");
		});
	}
});