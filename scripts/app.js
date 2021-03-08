var app = angular.module("App", ['ngDrag']);

var MAX_TITLE_LENGTH = 42;

app.controller("AppCtrl", ['$scope', '$filter', 'events', function($scope, $filter, events) {
	
	$scope.activeEvent = {};
	$scope.updatingEventLength = false;
	$scope.tasks = [];
	$scope.today = moment().format('LL');
	$scope.events = events.getEvents();

	$scope.message = "Good morning.";
	//console.log(moment().hour());
	if(moment().hour() >= 12 && moment().hour() < 17){
		$scope.message = "Good afternoon.";
	} else if(moment().hour() >= 17){
		$scope.message = "Good evening.";
	}

	$scope.timeblocks = [];
	for(let i = 4; i < 23; i++){
		$scope.timeblocks.push(i);
	}

	$scope.newEvent = (time) => {
		let startTime = moment().hour(time).minutes(0).valueOf();
		let endTime = moment().hour(time + 1).minutes(0).valueOf();
		let newEvent = new CalendarEvent(startTime, endTime);
		newEvent.title = "New Appointment";
		events.addEvent(newEvent);
	};

	$scope.editEvent = (event) => {
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
		events.updateEventTitle(event.id, activeEventTitle);
		$scope.activeEvent.draggable = true;
		$scope.activeEvent = {};
		document.querySelector("#title-" + event.id).textContent = $filter('truncate')(event.title);
	}

	$scope.dragging = (event) => {
		$scope.activeEvent = event;
		document.querySelector("#id-" + event.id).classList.remove('grab');
		document.querySelector("#id-" + event.id).classList.add('grabbing');
	}

	$scope.dropped = (time) => {
		if(!$scope.updatingEventLength){
			let receivedEvent = $scope.activeEvent;
			$scope.activeEvent = {};
			let newStartTime = moment().hour(time).minutes(0).seconds(0).valueOf();
			let minutes = receivedEvent.length * 60;
			let newEndTime = moment().hour(time).minutes(minutes).seconds(0).valueOf();
			events.updateEventTime(receivedEvent.id, newStartTime, false);
			events.updateEventTime(receivedEvent.id, newEndTime, true);
			document.querySelector("#id-" + receivedEvent.id).classList.remove('grabbing');
			document.querySelector("#id-" + receivedEvent.id).classList.add('grab');
		} 
	}

	// event in the context of these functions is
	// a CalendarEvent, not a document based event
	$scope.getEvents = (timeblock) => {
		return events.getEventsForTimeblock(timeblock);
	}

	$scope.deleteEvent = (event) => {
		events.deleteEvent(event.id);
	}

	$scope.setActiveEvent = (event) => {
		$scope.activeEvent = event;
		let activeEventElement = document.querySelector("#id-" + event.id);
		activeEventElement.draggable = false;
	}

	let timeOffset = 0;
	let baseTimeLength = 1;

	$scope.updateEventLength = (event) => {
		let offset = (mouse.y - mouseDownY) * (3/4) / 15;
		offset = Math.round(offset);
		if(timeOffset != offset){
			// the increment cannon make the event less than 15 minues... 
			timeOffset = offset;
			event.length = baseTimeLength + (timeOffset / 4);
		}
		
	}

	$scope.startUpdateLength = (event) => {
		baseTimeLength = event.length;
		document.querySelector("#event-length-grabber-" + event.id).style.opacity = 0;
		$scope.activeEvent = event;
		$scope.updatingEventLength = true;
	}

	$scope.endUpdateLength = (event) => {
		$scope.updatingEventLength = false;
		$scope.activeEvent = {};
		document.querySelector("#event-length-grabber-" + event.id).style.opacity = 0.5;
		events.updateEventLength(event.id, event.length);
		timeOffset = 0;
	}

	$scope.updateEventColor = (event, color) => {
		event.color = color;
		document.querySelector("#event-color-palet-" + event.id).style.display = 'none';
		events.updateEventColor(event.id, color);
	}

	$scope.showColorOptions = (event) => {
		document.querySelector('#event-color-palet-' + event.id).style.display = 'flex';
	}

	$scope.showEventOptions = (event) => {
		document.querySelector('#event-options-' + event.id).style.display = 'block';
	}

	$scope.hideEventOptions = (event) => {
		document.querySelector('#event-options-' + event.id).style.display = 'none';
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
		let event = getEventById(eventId);
		obj.events.splice(obj.events.indexOf(event), 1);
		saveEvents();
	}

	obj.updateEventTitle = (eventId, title) => {
		getEventById(eventId).title = title;
		saveEvents();
	}

	obj.updateEventLength = (eventId, length) => {
		getEventById(eventId).length = length;
		saveEvents();
	}

	obj.updateEventColor = (eventId, color) => {
		getEventById(eventId).color = color;
		saveEvents();
	}

	obj.updateEventTime = (eventId, time, end) => {
		obj.events.forEach(event => {
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
		obj.events.forEach(event => {
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
				foundEvent = obj.events[obj.events.indexOf(event)];
			};
		});
		return foundEvent;
	}


	const getEvents = () => {
		let events = localStorage.getItem('events');
		if(events === null){
			// If there are no calendar event, add placer holder events
			obj.events = calendarEvents;
			saveEvents();
		} else {
			obj.events = JSON.parse(events);
		}
	}

	const saveEvents = () => {
		let events = JSON.stringify(obj.events);
		localStorage.setItem('events', events);
	}

	return obj;
}]);

app.filter('numberAsTime', function() {
	return function(hour) {
		return moment().hour(hour).minute(0).format('h:mm a');
	};
});

app.filter('truncate', function() {
	return function(title) {
		if(title.length > MAX_TITLE_LENGTH){
			let str = title.slice(0, MAX_TITLE_LENGTH - 4);
			str += "...";
			return str;	
		} 
		return title;
	};
});

// Code for enableing drag events to work nicely with AngularJS
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
