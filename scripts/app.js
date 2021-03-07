var app = angular.module("App", ['ngDrag']);

const MAX_TITLE_LENGTH = 64;

app.controller("DayCtrl", ['$scope', function($scope){
	let today = moment();
	let tomorrow = moment().add(24, 'hour');
	let newDate = moment(tomorrow).format('LL');
	console.log(newDate);
	$scope.today = today.format('LL');
	$scope.tomorrow = tomorrow.format('LL');
}]);

app.controller("AppCtrl", ['$scope', '$filter', 'events', function($scope, $filter, events) {
	
	$scope.activeEvent = {};
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
		//console.log(time);
		let startTime = moment().hour(time).minutes(0).valueOf();
		let endTime = moment().hour(time + 1).minutes(0).valueOf();
		let newEvent = new CalendarEvent(startTime, endTime);
		newEvent.title = "Appointment";
		events.addEvent(newEvent);
		console.log("Created new event: " + newEvent.id);
	};

	$scope.editEvent = (event) => {
		console.log(event.id);
		console.log(event.title);
		let activeEvent = document.querySelector("#id-" + event.id);
		activeEvent.draggable = false;
		$scope.activeEvent = activeEvent;
		if(event.title.length > MAX_TITLE_LENGTH){
			document.querySelector("#title-" + event.id).textContent = event.title;	
		}

	}

	$scope.endEdit = (event) => {
		//console.log(event);
		let activeEvent = document.querySelector("#id-" + event.id);
		let activeEventTitle = document.querySelector("#title-" + event.id).textContent;
		console.log(activeEventTitle);
		events.updateEventTitle(event.id, activeEventTitle);
		console.log(event.id + " updated");
		$scope.activeEvent.draggable = true;
		$scope.activeEvent = {};
		console.log($filter('truncate')(event.title));
		document.querySelector("#title-" + event.id).textContent = $filter('truncate')(event.title);
	}

	$scope.dragging = (event) => {
		console.log("dragging");
		$scope.activeEvent = event;
	}

	$scope.dropped = (time) => {
		console.log("Dropped!");
		console.log(time);
		let receivedEvent = $scope.activeEvent;
		$scope.activeEvent = {};
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

	$scope.deleteEvent = (event) => {
		console.log("Deleting " + event.id);
		events.deleteEvent(event.id);
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
		console.log("EVENTID: " + eventId);
		let event = getEventById(eventId);
		console.log(event);
		console.log("INDEX: " + obj.events.indexOf(event));
		obj.events.splice(obj.events.indexOf(event), 1);
		saveEvents();
	}

	obj.updateEventTitle = (eventId, title) => {
		getEventById(eventId).title = title;
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

	const getEventById = (id) => {
		var foundEvent = null;
		obj.events.forEach(event => {
			if(event.id === id){
				console.log(event);
				console.log(obj.events.indexOf(event));
				foundEvent = obj.events[obj.events.indexOf(event)];
			};
		});
		return foundEvent;
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

app.filter('truncate', function() {
	//console.log(param);
	return function(title) {
		if(title.length > MAX_TITLE_LENGTH){
			let str = title.slice(0, MAX_TITLE_LENGTH - 4);
			str += "...";
			return str;	
		} 
		return title;
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
