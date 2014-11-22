
var validator = require('validator')
	, _		  = require('lodash');

/**
 * `SimpleVal` constructor
 *
 * @param {Object} data to validate
 * @param {Object} rules to validate by
 * @param {Object} message for each validation rule
 */
function SimpleVal(data, rules, msgs){
	this.data = data || {};
	this.rules = rules || {};
	this.msgs = msgs || {};
	this.extraData = {};

	// make supported rules to thier methods
	this.ruleMethodMap = {
		required: validator.isNull,
		min: function(val, length){
			return (val.length >= length) ? true : false;
		},
		max: function(val, length){
			return (val.length <= length) ? true : false;
		},
		btw: validator.isLength,
		email: validator.isEmail,
		inArr: validator.isIn
	}
}


/**
 * Some validation rule require additional data to perform validation
 * checks. This methods store additional data
 */ 
SimpleVal.prototype.addData = function(name, data){
	this.extraData[name] = data;
}


/**
 * Parse a rule declaration and return an object containing
 * a rule and its parameters 
 */
SimpleVal.prototype.parseRuleDeclaration = function(rd){
	if (!rd) return null;

	var rules = rd.split('|');
	var parsedRules = [];
	_.each(rules, function(rule){
		var ruleSplit = rule.split(':');
		var ruleName = ruleSplit[0];
		var ruleParams = ruleSplit[1] || '';
		parsedRules.push({ name: ruleName, params: ruleParams.split(',') });
	});
	return parsedRules;
}

/**
 * Apply rules to the value passed. Returns the a list of failed rules
 */
SimpleVal.prototype.applyRules = function(field, val, rules){

	var errors = [];

	_.each(rules, function(rule){
		
		// required check
		if (rule.name == 'required'){
			var method = this.ruleMethodMap[rule.name];
			if (method(val)){
				errors.push(field + '.' + rule.name);
			}
		}

		// min
		if (rule.name == 'min'){
			var method = this.ruleMethodMap[rule.name];
			if (!method(val, parseInt(rule.params[0]))){
				errors.push(field + '.' + rule.name);
			}
		}

		// max
		if (rule.name == 'max'){
			var method = this.ruleMethodMap[rule.name];
			if (!method(val, parseInt(rule.params[0]))){
				errors.push(field + '.' + rule.name);
			}
		}

		// btw
		if (rule.name == 'btw'){
			var method = this.ruleMethodMap[rule.name];
			if (!method(val, parseInt(rule.params[0]), parseInt(rule.params[1]))){
				errors.push(field + '.' + rule.name);
			}
		}

		// email
		if (rule.name == 'email' && val.length > 0){
			var method = this.ruleMethodMap[rule.name];
			if (!method(val, parseInt(rule.params[0]))){
				errors.push(field + '.' + rule.name);
			}
		}

		// inArr
		if (rule.name == 'inArr' && val.length > 0){
			var method = this.ruleMethodMap[rule.name];
			if (!method(val, this.extraData[rule.params[0]])){
				errors.push(field + '.' + rule.name);
			}
		}


	}, this);
	return errors;
}


/**
 * Convert fails to messages
 */
SimpleVal.prototype.failsToMsgs = function(fails){
	if (!fails) return [];

	var msgs = [];

	_.each(fails, function(fail){
		if (_.contains(Object.keys(this.msgs), fail)){
			msgs.push(this.msgs[fail])
		}

	}, this);
	return msgs;
}


/**
 * Starts the validation process by validating the data
 * entered in the constructor
 */
SimpleVal.prototype.fails = function(){
	
	var fails = [];

	// get the fields to validate
	var fieldsToValidate = Object.keys(this.data);

	_.each(fieldsToValidate, function(field){

		if (this.rules[field]){
			
			// get field rule declaration
			var ruleDeclaraton = this.rules[field];
			
			// parse rule declaration, separate all rules and their parameters
			var parsedRule = this.parseRuleDeclaration(ruleDeclaraton);

			// apply rules
			failed = this.applyRules(field, this.data[field], parsedRule);

			// convert fails to their respective messages
			_.each(this.failsToMsgs(failed), function(m){
				fails.push({ field: field, msg: m });
			});
		}
	}, this);

	return fails;
}

module.exports = SimpleVal;