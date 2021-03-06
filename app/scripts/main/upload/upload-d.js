'use strict';

/**
 * @ngdoc directive
 * @name scannabis.directive:upload
 * @description
 * # upload
 */
angular.module('scannabis')
	.directive('uploader', function ($rootScope, $sce, $firebaseArray, $firebaseObject, Data) {

		return {
			replace: true,
			scope: {
				name: '@name',
				pass: '=pass'
			},
			template: '<form id="{{name}}-form" novalidate><input class="well" type="file" id="{{name}}"/><button type="button" class="tertiary" data-ng-click="upload()">Upload</button><p>{{message}}</p></form>',
			restrict: 'E',
			link: function (scope, elem) {
				scope.upload = function () {
					scope.message = 'Processing upload...';
					scope.pass ? scope.pass.media = null : $rootScope.media = null;
					var fbImagesRef = (scope.name === 'identification' || scope.name === 'authorization'|| scope.name === 'licensing'|| scope.name === 'profile') ?
						($rootScope.secure ? null : $rootScope.secure = {raw:{}}, 'https://scannabis.firebaseio.com/secure/images')  :
						'https://scannabis.firebaseio.com/images' ;
					var fbUsersImagesRef = (scope.name === 'identification' || scope.name === 'authorization'|| scope.name === 'licensing'|| scope.name === 'profile') ?
						'https://scannabis.firebaseio.com/superuser/secure/images':
						'https://scannabis.firebaseio.com/users/'+Data.auth.uid+'/public/images';
					var fbImages = new Firebase(fbImagesRef);
					var fbUserImages = new Firebase(fbUsersImagesRef);
					var fbImagesArray = $firebaseArray(fbImages);
					var fbUserImagesObject = $firebaseObject(fbUserImages);
					var fileList = document.getElementById(scope.name).files;
					console.log('files', fileList);
					angular.forEach(fileList,
						function (file) {
							scope.reader = new FileReader(file);
							scope.reader.onload = (function (file) {
								scope.reader.readAsDataURL(file);
								return function (e) {
									console.log('-- RESULT', e.target.result, '-- NAME:', file.name);
									var img = new Image();
									img.src = e.target.result;
									scope.message = 'Uploading...';
									fbImagesArray.$add(img.src).then(function (ref) {
										(scope.name === 'identification' || scope.name === 'authorization'|| scope.name === 'licensing'|| scope.name === 'profile') ?
											($rootScope.secure.raw[scope.name]=img.src, fbUserImagesObject[scope.name] = ref.key(), $rootScope.secure[scope.name] = ref.key() ) :
											fbUserImagesObject[JSON.stringify(file.name.replace(/\./g, '``'))] = ref.key();
										fbUserImagesObject.$save();
										scope.message = 'Success';
										!scope.pass ? $rootScope.media = ref.key() : scope.pass.media = ref.key();
										document.getElementById(scope.name).value = null;
										setTimeout(function () {
											scope.message = '';
										}, 3000);

									});
								}
							})(file);
						})
				}
			}
		}
	});