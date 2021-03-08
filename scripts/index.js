function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let calendarEvents = [];

class CalendarEvent {
	constructor(start, end) {
		this.start = new Date(start);
		this.end = new Date(end);
		this.title = null;
		this.color = "green";
		this.id = uuidv4();
		this.length = (this.end.getTime() - this.start.getTime()) / 60 / 60 / 1000;
	}
};

console.log(moment().calendar());
console.log(moment().add(2, 'hour').calendar());

Date.prototype.addHours = function(h) {
	this.setTime(this.getTime() + (h*60*60*1000));
	return this;
}

Date.prototype.addMintues = function(m) {
	this.setTime(this.getTime() + (m*60*1000));
	return this;
}

function allowDrop(ev) {
	ev.preventDefault();
	ev.stopPropagation();
}

function preventDrop(ev) {
	ev.stopPropagation();
}

function drop(ev) {
	ev.preventDefault();
	ev.stopPropagation();
	//var data = ev.dataTransfer.getData("id");
	//ev.target.appendChild(document.getElementById(data));
}

function drag(ev) {
	//ev.dataTransfer.setData("id", ev.target.id);
}

function resize(ev) {
	console.log("resizing");
	ev.dataTransfer.setData("id", ev.target.id);
	//ev.stopPropagation();
}

// mouse handler
const mouse = {};
mouse.x = 0;
mouse.y = 0;
mouseDownY = 0;

const mouseDownHandler = (ev) => {
	//console.log("down girl!");
	mouseDownY = ev.clientY;
}

const handleMouseMove = (ev) => {
	mouse.x = ev.clientX;
	mouse.y = ev.clientY;
}
$( document ).ready(function() {
	document.ondrag = handleMouseMove;
});

// Create three demo events

let startTime = moment().hour(8).minutes(0).seconds(0).valueOf();
//let endTime = moment().hour(8).minutes(30).seconds(0).valueOf();
let endTime = moment().hour(8).minutes(45).seconds(0).valueOf();
let breakfast = new CalendarEvent(startTime, endTime);
breakfast.title = "Breakfast";

console.log(breakfast.length);

let lstartTime = moment().hour(11).minutes(0).seconds(0).valueOf();
let lendTime = moment().hour(13).minutes(0).seconds(0).valueOf();
let lunch = new CalendarEvent(lstartTime, lendTime);
lunch.title = "Lunch";
lunch.description = "Lunch with Herb.";

let dstartTime = moment().hour(17).minutes(0).seconds(0).valueOf();
let dendTime = moment().hour(18).minutes(0).seconds(0).valueOf();
let dinner = new CalendarEvent(dstartTime, dendTime);
dinner.title = "Dinner";
dinner.description = "Dinner at the nice restaurant.";

calendarEvents.push(breakfast);
calendarEvents.push(lunch);
calendarEvents.push(dinner);

console.log(calendarEvents);