var app = angular.module("App", ['ngDrag']);

app.controller("DayCtrl", ['$scope', function($scope){
	let today = moment();
	let tomorrow = moment().add(24, 'hour');
	let newDate = moment(tomorrow).format('LL');
	console.log(newDate);
	$scope.today = today.format('LL');
	$scope.tomorrow = tomorrow.format('LL');
}]);

app.controller("AppCtrl", ['$scope', 'events', function($scope, events) {
	
	$scope.activeTask = {};
	$scope.tasks = [];
	
	$scope.events = events.getEvents();
	console.log($scope.events);

	$scope.message = "Good morning.";
	//console.log(moment().hour());
	if(moment().hour() >= 12 && moment().hour() < 17){
		$scope.message = "Good afternoon.";
	} else if(moment().hour() >= 17){
		$scope.message = "Good evening.";
	}

	$scope.timeblocks = [];
	for(let i = 0; i < 24; i++){
		$scope.timeblocks.push(i);
	}

	$scope.newEvent = (time) => {
		console.log(time);
		let startTime = moment().hour(time).minutes(0).valueOf();
		let endTime = moment().hour(time + 1).minutes(0).valueOf();
		let newEvent = new CalendarEvent(startTime, endTime);
		newEvent.title = "Appointment";
		events.addEvent(newEvent);
	};

	$scope.editEvent = (event) => {
		console.log(event.id);
		document.querySelector("#id-" + event.id).draggable = false;
		//document.querySelector("#title-" + event.id).contenteditable = true;
	}

	$scope.endEdit = (event) => {
		console.log(event);
		console.log("blur");
	}

	$scope.movingEvent = {};

	$scope.dragging = (event) => {
		console.log("dragging");
		$scope.movingEvent = event;
	}

	$scope.dropped = (time) => {
		console.log("Dropped!");
		console.log(time);
		let receivedEvent = $scope.movingEvent;
		$scope.movingEvent = {};
		console.log(receivedEvent);

		let newStartTime = moment().hour(time).minutes(0).seconds(0).valueOf();
		let minutes = receivedEvent.length * 60;
		let newEndTime = moment().hour(time).minutes(minutes).seconds(0).valueOf();
		events.updateEventTime(receivedEvent.id, newStartTime, false);
		events.updateEventTime(receivedEvent.id, newEndTime, true);
	}

	$scope.getEvents = (timeblock) => {
		return events.getEventsForTimeblock(timeblock);
	}

}]);


app.factory('events', [function(){
	obj = {};
	obj.events = [];

	// events is a large list of all the events in the calendar
	obj.addEvent = (event) => {
		obj.events.push(event);
		saveEvents();
	}

	obj.deleteEvent = (eventId) => {
		obj.events.forEach(event => {
			if(event.id === eventId){
				obj.events.splice(events.indexOf(event), 1);
			}
		});
		saveEvents();
	}

	obj.updateEventTime = (eventId, time, end) => {
		obj.events.forEach(event => {
			//console.log(moment(event.start).hour());
			if(event.id === eventId){
				if(end){
					event.end = time;		
				} else {
					event.start = time;
				}
			}
		});
		saveEvents();
	}

	// timeblocks are arrays of events whos start times
	// are in that block
	obj.getEventsForTimeblock = (timeblock) => {
		let eventsInThisTimeBlock = [];
		//console.log(timeblock);
		obj.events.forEach(event => {
			//console.log(moment(event.start).hour());
			if(moment(event.start).hour() === timeblock) eventsInThisTimeBlock.push(event);
		});
		return eventsInThisTimeBlock;
	}

	obj.getEvents = () => {
		getEvents();
		return obj.events;
	}

	const getEvents = () => {
		let events = localStorage.getItem('events');
		if(events === null){
			//localStorage.setItem('events', '');
			obj.events = calendarEvents;
			saveEvents();
		} else {
			obj.events = JSON.parse(events);
			//obj.events = calendarEvents;
		}
	}

	const saveEvents = () => {
		let events = JSON.stringify(obj.events);
		localStorage.setItem('events', events);
	}

	return obj;
}]);

app.filter('numberAsTime', function() {
	//console.log(param);
	return function(hour) {
		return moment().hour(hour).minute(0).format('h:mm a');
	};
});

(function(){
	var ngDragEventDirectives = {};

	angular.forEach(
		'drag dragend dragenter dragexit dragleave dragover dragstart drop'.split(' '),
		function(eventName) {
			var directiveName = 'ng' + eventName.charAt(0).toUpperCase() + eventName.slice(1);

			ngDragEventDirectives[directiveName] = ['$parse', '$rootScope', function($parse, $rootScope) {
				return {
					restrict: 'A',
					compile: function($element, attr) {
						var fn = $parse(attr[directiveName], null, true);

						return function ngDragEventHandler(scope, element) {
							element.on(eventName, function(event) {
								var callback = function() {
									fn(scope, {$event: event});
								};

								scope.$apply(callback);
							});
						};
					}
				};
			}];
		}
	);

	angular
		.module('ngDrag', [])
		.directive(ngDragEventDirectives);
}());
