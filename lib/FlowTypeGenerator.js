'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toFlowType = exports.upperCamelCase = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _types = require('@babel/types');

var t = _interopRequireWildcard(_types);

var _validateIdentifier = require('./validateIdentifier');

var _FlowSchema = require('./FlowSchema');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const upperCamelCase = exports.upperCamelCase = str => _lodash2.default.upperFirst(_lodash2.default.camelCase(str));

const optional = astNode => _lodash2.default.assign(astNode, { optional: true });

const processArraySchema = (flowSchema, processor) => t.genericTypeAnnotation(t.identifier('Array'), t.typeParameterInstantiation([processor(flowSchema.flowType('any'))]));

const processObjectSchema = (flowSchema, processor) => {
  const properties = _lodash2.default.map(flowSchema.$properties || {}, (fieldFlowSchema, field) => {
    const identifier = (0, _validateIdentifier.isValidObjectKey)(field) ? t.identifier(field) : t.stringLiteral(field);

    const ast = t.objectTypeProperty(identifier, processor(fieldFlowSchema));

    if (_lodash2.default.includes(flowSchema.$required, field)) {
      return ast;
    }

    return optional(ast);
  });

  return t.objectTypeAnnotation(properties, flowSchema.$union ? [t.objectTypeIndexer(t.identifier('key'), t.anyTypeAnnotation(), processor(flowSchema.flowType('any')))] : null, null, null, !!flowSchema.$exact);
};

const toFlowType = exports.toFlowType = flowSchema => {
  if (flowSchema.$flowRef) {
    return t.genericTypeAnnotation(t.identifier(upperCamelCase(flowSchema.$flowRef)));
  }

  if (flowSchema.$enum) {
    return t.unionTypeAnnotation(_lodash2.default.map(flowSchema.$enum, value => t.genericTypeAnnotation(t.identifier(JSON.stringify(value)))));
  }

  if (flowSchema.$flowType === 'Array') {
    return processArraySchema(flowSchema, toFlowType);
  }

  if (flowSchema.$flowType === 'Object') {
    return processObjectSchema(flowSchema, toFlowType);
  }

  if (flowSchema.$union) {
    return t.unionTypeAnnotation(_lodash2.default.map(flowSchema.$union, toFlowType));
  }

  if (flowSchema.$intersection) {
    return t.intersectionTypeAnnotation(_lodash2.default.map(flowSchema.$intersection, toFlowType));
  }

  if (flowSchema.$flowType === 'any') {
    return t.anyTypeAnnotation();
  }

  if (flowSchema.$flowType === 'null') {
    return t.nullLiteralTypeAnnotation();
  }

  return t.createTypeAnnotationBasedOnTypeof(flowSchema.$flowType);
};