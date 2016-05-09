/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.container', [ 'ngAnimate', 'ui.bootstrap', 'utility.validation', 'filter.currentTime', 'apis.workzone', 'factory.appPermission', 'mgcrea.ngStrap', 'ngSanitize', 'utility.pagination'])
		.controller('containerCtrl', ['$scope', '$rootScope', '$modal', '$q', 'workzoneServices', 'workzoneUIUtils', 'paginationUtil','$timeout','uiGridOptionsService', function($scope, $rootScope, $modal, $q, workzoneServices, workzoneUIUtils, paginationUtil, $timeout, uiGridOptionsService) {
			$scope.isContainerPageLoading = true;
			var gridBottomSpace = 60;
			var containerUIGridDefaults = uiGridOptionsService.options();
			$scope.paginationParams = containerUIGridDefaults.pagination;
			$scope.tabData = [];
			$scope.truncateImageIDLimit = 12;
			
			$scope.initGrids = function(){
				$scope.containerGridOptions=angular.extend(containerUIGridDefaults.gridOption,{
				data : 'tabData',
					columnDefs : [
						{ name:'Actions',enableSorting: false ,cellTemplate:'<span class="containerIcon greenBg" ng-click="grid.appScope.containerAction(row.entity,2)" id="power-off"  ng-show="grid.appScope.checkEdited(row.entity) && grid.appScope.checkProgress(row.entity)" title="Stop"><i class="white {{grid.appScope.stopDockerFunction(row.entity)}}"></i></span>'+
						'<span class="marginleft5 containerIcon yellowBg white" ng-click="grid.appScope.containerAction(row.entity,3)" id="undo"  title="Restart" ng-show="grid.appScope.checkEdited(row.entity) && grid.appScope.checkProgress(row.entity)"><i class="white fa fa-undo"></i></span>'+
						'<span class="marginleft5 containerIcon grayBg white" ng-click="grid.appScope.containerAction(row.entity,4)" id="pause" title="Pause" ng-show="grid.appScope.checkEdited(row.entity) && !grid.appScope.checkPausePlay(row.entity) && grid.appScope.checkProgress(row.entity)"><i class="white fa fa-pause"></i></span>'+
						'<span class="marginleft5 containerIcon grayBg white" ng-click="grid.appScope.containerAction(row.entity,5)" id="play" title="Play" ng-show="grid.appScope.checkEdited(row.entity) && grid.appScope.checkPausePlay(row.entity) && grid.appScope.checkProgress(row.entity)"><i class="white fa fa-eject fa fa-rotate-90"></i></span>'+
						'<span class="marginleft5 containerIcon crimsonBg white" ng-click="grid.appScope.containerAction(row.entity,6)"  id="sign-out" title="Terminate" ng-show="grid.appScope.checkProgress(row.entity)"><i class="white fa fa-sign-out"></i></span>', cellTooltip: true},
						{ name:'State',field:'containerStatus',cellTooltip: true},
						{ name:'Created',cellTemplate:'<span>{{row.entity.Created*1000  | timestampToCurrentTime}}</span>',cellTooltip: true},
						{ name:'Name',cellTemplate:'<span ng-bind-html="row.entity.Names"></span>', enableSorting: false, cellTooltip: true},
						{ name:'Instance IP',field:'instanceIP','displayName':'Instance IP',cellTooltip: true},
						{ name:'Container ID',enableSorting: false ,'displayName':'Container ID', cellTemplate:'<div class=""><span title="{{row.entity.Id}}">{{grid.appScope.getImageId(row.entity.Id)}}</span></div>', cellTooltip:true},
						{ name:'Image',field:'Image',cellTooltip: true},
						{ name:'More Info',enableSorting: false ,cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.dockerMoreInfo(row.entity)"></i></div>', cellTooltip: true}
					],
				});
			};
			/*APIs registered are triggered as ui-grid is configured 
			for server side(external) pagination.*/
			$scope.containerGridOptions = angular.extend(containerUIGridDefaults.gridOption, {
				onRegisterApi :function(gridApi) {
					$scope.gridApi = gridApi;
					//Sorting for sortBy and sortOrder
					gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
						$scope.paginationParams.sortBy = sortColumns[0].field;
						$scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
						$scope.getContainerList();
					});
					//Pagination for page and pageSize
					gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
						$scope.paginationParams.page = newPage;
						$scope.paginationParams.pageSize = pageSize;
						$scope.getContainerList();
					});
				},
			});
			$scope.getContainerList = function() {
				$scope.isContainerPageLoading = true;
				workzoneServices.getDockerContainers($scope.envParams, $scope.paginationParams).then(function(result) {
					$timeout(function() {
						$scope.containerGridOptions.totalItems = result.data.metaData.totalRecords;
						$scope.tabData = result.data.containerList;
						$scope.isContainerPageLoading = false;
					}, 100);
				}, function(error) {
					$scope.isContainerPageLoading = false;
					console.log(error);
					$scope.errorMessage = "No Records found";
				});
			};
			$scope.stopDockerFunction = function(actionType){
				return (actionType)? "fa fa-power-off" : "fa fa-play";
			};
			$scope.getImageId = function(imageId){
				return imageId.substring(0,$scope.truncateImageIDLimit);
			};
			
			$scope.dockerPopUpPages= {
				2:{ page:'dockerstopplay', ctrl:'dockerControllers' },
				3:{ page:'dockerreload', ctrl:'dockerControllers' },
				4:{ page:'dockerplaypause', ctrl:'dockerControllers' },
				5:{ page:'dockerplaypause', ctrl:'dockerControllers' },
				6:{ page:'dockerterminate', ctrl:'dockerControllers' }
			};

			
			$scope.checkEdited = function(_app){
				    return (_app.containerStatus === 'STOP' ) ? false : true;
			};
			$scope.checkProgress=function(_app){
				if(_app.containerStatus.indexOf('Progress') >=0)
					return false;
				else
					return true;
			};
			$scope.checkcAdvisor = function(_app){
				return (_app.Image.indexOf('cadvisor') >=0 ) ? true : false;
			};

			$scope.checkPausePlay = function(_app){
				return (_app.containerStatus==='PAUSE') ? true : false;
			};
			$scope.showcAdvisor = function(app){
				var cAdvisorInstance = $modal.open({
					animate:true,
					templateUrl:'src/partials/sections/dashboard/workzone/container/popups/dockercAdvisor.html',
					controller:'dockercAdvisorCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve:{
						items:function(){
							return app.instanceip;
						}
					}
				});
				cAdvisorInstance.result.then(
					function(){
						console.log('Modal dismissed at: ' + new Date());
					}, 
					function(){
						console.log('Modal dismissed at: ' + new Date());
					}
				);
			};
			$scope.containerAction = function(app, action) {
				var itemIdx = $scope.tabData.indexOf(app);
				var modalInstance = $modal.open({
					animate: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/container/popups/' + $scope.dockerPopUpPages[action].page + '.html',
					controller: 'dockerControllers',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return app.Id.substring(0, $scope.truncateImageIDLimit);
						}
					}
				});
				modalInstance.result.then(function() {
						workzoneServices.checkDockerActions(app.instanceId, app.Id, action)
							.then(function(response) {
								if (response.data.data === "ok") {
									if (action === "2") { //STOP AND PLAY CONTAINER
										$scope.tabData[itemIdx].isStop = !$scope.tabData[itemIdx].isStop;
									} else if (action === "3") { //RELOAD CONTAINERS
										workzoneServices.getDockerContainers()
											.then(function(response) {
												$scope.tabData[itemIdx] = response.data[itemIdx];
											});
									} else if (action === "4") { // PAUSE CONTAINER
										$scope.tabData[itemIdx].isPause = !$scope.tabData[itemIdx].isPause;
									} else if (action === "5") { // PLAY CONTAINER
										$scope.tabData[itemIdx].isPause = !$scope.tabData[itemIdx].isPause;
									} else if (action === "6") { // DELETE CONTAINER
										$scope.tabData.splice(itemIdx, 1);
									}
								}
							});
					},
					function() {
						$scope.tabData[itemIdx].isActive = true;
						console.log('Modal dismissed at: ' + new Date());
					}
				);
			};
			$scope.dockerMoreInfo = function(app){
				 var modalInstance = $modal.open({
					animation:true,
					templateUrl:'src/partials/sections/dashboard/workzone/container/popups/dockermoreinfo.html',
					controller:'dockerMoreInfoCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve:{
						items:function(){
							return app;
						}
					}
				});
				modalInstance.result.then(
					function(){
						console.log('Modal closed at: ' + new Date());
					},
					function(){
						console.log('Modal dismissed at: ' + new Date());
					}
				);
			};
			$rootScope.$on('WZ_TAB_VISIT', function(event, tabName) {
				if (tabName === 'Containers') {
					$scope.isContainerPageLoading = true;
					var tableData = $scope.tabData;
					$scope.tabData = [];
					$timeout(function() {
						$scope.tabData = tableData;
						$scope.isContainerPageLoading = false;
					}, 100);
				}
			});
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams){
				$scope.envParams = requestParams;
				$scope.initGrids();
				$scope.getContainerList();
				$scope.gridHeight = workzoneUIUtils.makeTabScrollable('containerPage')-gridBottomSpace;
			});
		}])
		.controller('dockercAdvisorCtrl',['$scope','$modalInstance','items','workzoneServices', '$sce', function($scope, $modalInstance ,items,workzoneServices, $sce){
			$scope.items = items;            
				$scope.getcAdvisorUrl=function(dns_extract){
					return $sce.trustUrl("http://"+dns_extract+":8080/docker/");
				};
				$scope.cancel=function(){
					$modalInstance.dismiss('cancel');
				};
		}])
		.controller('dockerMoreInfoCtrl',  ['$scope', '$modalInstance', 'items', 'workzoneServices', function($scope, $modalInstance, items, workzoneServices) { 
			$scope.dockerInfoResponse="";
			$scope.tabs = [
				{
					'title': 'General-Info',
					'template': 'src/partials/sections/dashboard/workzone/container/templates/dockerGeneralInfo.html'
				},
				{
					'title': 'State',
					'template': 'src/partials/sections/dashboard/workzone/container/templates/dockerState.html'
				},
				{
					'title': 'Image',
					'template': 'src/partials/sections/dashboard/workzone/container/templates/dockerImage.html'
				}
			];
			$scope.tabs.activeTab = "General-Info";
			workzoneServices.getDockerMoreInfo(items.instanceId,items.Id)
				.then(function(response){
					$scope.dockerInfoResponse = response.data;
				});
			angular.extend($scope,{
				cancel:function(){
					$modalInstance.dismiss('cancel');
				}
			});
		}])

		.controller('dockerControllers',  ['$scope', '$modalInstance', function ($scope, $modalInstance) {

			angular.extend($scope,{
				cancel:function(){
					$modalInstance.dismiss('cancel');
				},
				ok:function(){
					$modalInstance.close();
				}
			});
		}
	]);
})(angular);
