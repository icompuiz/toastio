'use strict';

angular.module('toastio')
	.directive('centerElement', function() {
		return {
			restrict: 'EA',
			link: function(scope, element) {
				function centerElement() {

					var height = element.height();
					var width = element.width();

					var marginTop = (height + 200) / -2;
					var marginLeft = width / -2;

					element.css({
						position: 'absolute'
					});

					element.css({
						left: '50%' ,
						right: '50%',
						top: '50%',
						'margin-top': marginTop,
						'margin-left': marginLeft,
						'margin-right': marginLeft
					});
				}
				centerElement();

				$(window).on('resize', centerElement);

			}
		};
	});
