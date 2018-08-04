'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseSchema = exports.schemaToFlow = exports.toFlow = exports.toFlowType = exports.convertSchema = exports.simplifySchema = undefined;

var _types = require('@babel/types');

var t = _interopRequireWildcard(_types);

var _generator = require('@babel/generator');

var _generator2 = _interopRequireDefault(_generator);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Schema = require('./Schema');

var _FlowSchema = require('./FlowSchema');

var _FlowTypeGenerator = require('./FlowTypeGenerator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.simplifySchema = _Schema.simplifySchema;
exports.convertSchema = _FlowSchema.convertSchema;
exports.toFlowType = _FlowTypeGenerator.toFlowType;
const toFlow = exports.toFlow = flowSchema => t.exportNamedDeclaration(t.typeAlias(t.identifier((0, _FlowTypeGenerator.upperCamelCase)(flowSchema.$id)), null, (0, _FlowTypeGenerator.toFlowType)(flowSchema)), []);

const schemaToFlow = exports.schemaToFlow = flowSchema => _lodash2.default.map([..._lodash2.default.map(flowSchema.$definitions, toFlow), toFlow(flowSchema)], ast => (0, _generator2.default)(ast).code).join('\n\n');

const parseSchema = exports.parseSchema = (schema, imports) => _lodash2.default.flow(s => (0, _Schema.simplifySchema)(s, imports), _FlowSchema.convertSchema, schemaToFlow)(schema);