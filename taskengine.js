module.exports = function() {

	var fs = require('fs'),
		_ = require('underscore'),
		clc = require('cli-color'),
		taskFile = process.env.HOME + "/tasks.json",
		defaultTask = {
			id: -1,
			open: true,
			name: "",
			sort: 0,
			description: "",
			url: "",
			dueDate: 0,
			scheduledDate: 0,
			dateAdded: 0,
			comments: "",
			subTasks: [],
			priority: 0,
		};

	var TaskLib = function TaskLibConstructor() {
		this.largestID = 0;
		this.tasks = [];

	};

	TaskLib.prototype = {
		tasks: [],
		largestID: 0,
		init: function(readyCallback) {
			var self = this;

			fs.readFile(taskFile, 'utf8', function(err, data) {
				self.readTasks(err, data, readyCallback);
			});

		},
		/**
		 * Called before exiting the program
		 *
		 * @return {undefined}
		 */
		close: function exit() {
			this.writeTasks();
		},

		/**
		 * Parse the tasks from a string and set the global tasks array
		 *
		 * @param err
		 * @param {String} data
		 * @param {function} callback
		 * @return {undefined}
		 */
		readTasks: function readTasks(err, data, callback) {
			this.tasks = JSON.parse(data);

			var sortedTasks = _.sortBy(this.tasks, function(task) { return parseInt(task.id, 10); });
			largestID = sortedTasks[sortedTasks.length-1].id;

			if(callback) {
				callback(err, this);
			}
		},

		/**
		 * Write all tasks to the JSON file
		 *
		 * @return {undefined}
		 */
		writeTasks: function writeTasks() {
			fs.writeFile(taskFile, JSON.stringify(this.tasks), function(){});
		},
		getTaskByID: function getTaskByID(taskID) {
			var task = _.findWhere(this.tasks, {id: taskID});

			return task;
		},

		/**
		 * Parse the "key: value" formatted input into an object
		 *
		 * @param {String} data The input string
		 * @return {object} The parsed object
		 */
		parseInputData: function parseInputData(data) {
			var keyValRegExPattern = /[a-zA-Z]*:/g;
			var keys = data.match(keyValRegExPattern),
				values = data.split(keyValRegExPattern),
				parsedObject = {};

			// Pop the first blank one off the top
			values.shift();


			for(var i=values.length-1; i >=0; i--) {
				var value = values[i],
					key = keys[i];

				// Trim whitespace
				value = value.trim();

				// Trim any trailing commas
				if(value[value.length-1] === ",") {
					value = value.substring(0, value.length-1);
				}

				// Add to object and trim trailing : from key
				parsedObject[ key.substring(0,key.length-1) ] = value;
			}

			return parsedObject;

		},

		/**
		 * Add the given task to our array
		 *
		 * @param taskData
		 * @param callback
		 * @return {undefined}
		 */
		addTask: function addTask(taskData, subTaskData) {
			var subTaskList,
				parsedData,
				subTask = false;

			if(taskData !== undefined) {
				if(parseInt(taskData,10) > -1) {
					subTaskList = this.getTaskByID(parseInt(taskData,10)).subTasks;

					parsedData = this.parseInputData(subTaskData);
					subTask = true;
				}
				else {
					parsedData = this.parseInputData(taskData);
				}


				var newTask = _.clone(defaultTask)
				_.extend(newTask, parsedData);

				newTask.dateAdded = Date.now();
				newTask.id = largestID + 1;
				newTask.subTask = subTask;

				this.tasks.unshift( newTask );

				if(subTask) {
					subTaskList.push(newTask.id);
				}

				console.log('Added:');
				return newTask;
			}
			else {
				console.log('no task name given');
				return false;
			}

		},

		editTask: function editTask(taskID, params) {
			taskID = parseInt( taskID, 10 );
			params = this.parseInputData(params);

			var task = this.getTaskByID(taskID);

			// Concatenate name or description if indicated
			if(params.description && params.description[0] === "+") {
				params.description = task.description + " " + params.description;
			}
			if(params.name && params.name[0] === "+") {
				params.name = task.name + " " + params.name;
			}

			if(task) {
				_.extend(task, params);

				return task;
			}
			else {
				return false;
			}
		},

		moveTask: function() {

		},

		removeTask: function removeTask(taskID) {
			taskID = parseInt(taskID, 10);
			var task = this.getTaskByID(taskID);
			var taskIndex = this.tasks.indexOf(task);

			if(task) {
				this.tasks.splice(taskIndex, 1);

				console.log('Removing:');
				return task;
			}
			else {
				return false;
			}

		},

		/**
		 * Set a task as "done" or "closed"
		 *
		 * @return {undefined}
		 */
		closeTask: function closeTask(taskID) {
			taskID = parseInt(taskID, 10);
			var task = this.getTaskByID(taskID);

			if(task) {
				task.open = false;
				console.log('closing:');

				return task;
			}
			else {
				return false;
			}

		},
	};

	return new TaskLib();
};

