'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertSchema = exports.flow = exports.FlowSchema = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const hasProps = (schema, props) => _lodash2.default.reduce(props, (result, prop) => result || _lodash2.default.has(schema, prop), false);

const isObject = schema => hasProps(schema, ['properties', 'additionalProperties', 'patternProperties', 'maxProperties', 'minProperties']);

const isArray = schema => hasProps(schema, ['items', 'additionalItems', 'maxItems', 'minItems', 'uniqueItems']);

let FlowSchema = exports.FlowSchema = class FlowSchema {

  constructor(flowSchema) {
    this.$id = flowSchema.$id;
    this.$flowType = flowSchema.$flowType;
    this.$flowRef = flowSchema.$flowRef;
    this.$enum = flowSchema.$enum;
    this.$definitions = flowSchema.$definitions;

    this.$union = flowSchema.$union;
    this.$intersection = flowSchema.$intersection;

    // only for Object
    this.$properties = flowSchema.$properties;
    this.$required = flowSchema.$required;
    this.$exact = flowSchema.$exact;
  }

  $set(key, value) {
    return new FlowSchema(_extends({}, this, {
      [key]: value
    }));
  }

  id(id) {
    return this.$set('$id', id);
  }

  flowType(flowType) {
    return this.$set('$flowType', flowType);
  }

  flowRef(flowRef) {
    return this.$set('$flowRef', flowRef);
  }

  definitions(definitions) {
    if (_lodash2.default.isEmpty(definitions)) {
      return this;
    }
    return this.$set('$definitions', definitions);
  }

  props(properties, required) {
    return this.flowType('Object').$set('$properties', properties).$set('$required', required || []);
  }

  enum(values) {
    if (_lodash2.default.isEmpty(values)) {
      return this;
    }
    return this.$set('$enum', values);
  }

  union(flowSchemas) {
    const finalFlowSchemas = FlowSchema.omitUndefined(flowSchemas);
    if (_lodash2.default.isEmpty(finalFlowSchemas)) {
      return this;
    }
    return this.$set('$union', finalFlowSchemas);
  }

  intersection(flowSchemas) {
    const finalFlowSchemas = FlowSchema.omitUndefined(flowSchemas);
    if (_lodash2.default.isEmpty(finalFlowSchemas)) {
      return this;
    }
    return this.$set('$intersection', finalFlowSchemas);
  }

  setExact(isExact) {
    return this.$set('$exact', isExact);
  }
};

FlowSchema.omitUndefined = arr => _lodash2.default.filter(arr, item => !_lodash2.default.isUndefined(item));

const flow = exports.flow = flowType => new FlowSchema({}).flowType(flowType || 'any');

const convertSchema = exports.convertSchema = schema => {
  if (schema.$ref) {
    return flow().id(schema.id).flowRef(schema.$ref);
  }

  if (schema.allOf) {
    const patchedSchema = _lodash2.default.reduce(schema.allOf, (prev, item) => _lodash2.default.mergeWith(prev, item, (mergedValue, newValue, key) => {
      if (_lodash2.default.isNil(mergedValue)) {
        return;
      }
      if (key === 'required') {
        return _lodash2.default.uniq(mergedValue.concat(newValue)); // eslint-disable-line consistent-return
      }
      if (_lodash2.default.isPlainObject(mergedValue)) {
        if (!_lodash2.default.isPlainObject(newValue)) {
          throw new Error(`Failed to merge "allOf" schemas because "${key}" has different values.`);
        }
        return;
      }
      _assert2.default.deepEqual(mergedValue, newValue, `Failed to merge "allOf" schemas because "${key}" has different values: ${JSON.stringify(mergedValue)} and ${JSON.stringify(newValue)}.`);
    }), _lodash2.default.omit(schema, ['allOf', '$ref']));

    return convertSchema(patchedSchema);
  }

  const f = flow().id(schema.id).enum(schema.enum).definitions(_lodash2.default.mapValues(schema.definitions, (definition, id) => convertSchema(_lodash2.default.assign(_lodash2.default.omit(definition, '$ref'), { id }))));

  if (_lodash2.default.isArray(schema.type)) {
    return f.union(_lodash2.default.map([].concat(schema.type || []), type => convertSchema(_extends({}, schema, {
      type
    }))));
  }

  if (schema.oneOf && schema.properties) {
    const oneOfs = _lodash2.default.map(schema.oneOf, oneOf => _extends({}, oneOf, {
      properties: _extends({}, schema.properties, oneOf.properties)
    }));
    return f.union(_lodash2.default.map(oneOfs, convertSchema));
  } else if (schema.oneOf) {
    return f.union(_lodash2.default.map(schema.oneOf, convertSchema));
  }

  if (schema.anyOf && schema.properties) {
    const oneOfs = _lodash2.default.map(schema.anyOf, anyOf => _extends({}, anyOf, {
      properties: _extends({}, schema.properties, anyOf.properties)
    }));
    return f.union(_lodash2.default.map(oneOfs, convertSchema));
  } else if (schema.anyOf) {
    return f.union(_lodash2.default.map(schema.anyOf, convertSchema));
  }

  if (isObject(schema) && isArray(schema)) {
    return f.flowType('any');
  }

  if (isObject(schema)) {
    let objectType = f.flowType('Object').props(_lodash2.default.mapValues(schema.properties, convertSchema), schema.required).union([..._lodash2.default.map(schema.patternProperties, convertSchema), typeof schema.additionalProperties === 'object' ? convertSchema(schema.additionalProperties) : undefined, typeof schema.additionalProperties === 'boolean' && schema.additionalProperties ? convertSchema({}) : undefined]);

    if (schema.additionalProperties != null) {
      objectType = objectType.setExact(schema.additionalProperties === false);
    }

    return objectType;
  }

  if (isArray(schema)) {
    return f.flowType('Array').union(_lodash2.default.map([].concat(schema.items || {}), convertSchema));
  }

  switch (_lodash2.default.toLower(String(schema.type))) {
    case 'string':
      return f.flowType('string');
    case 'number':
    case 'integer':
      return f.flowType('number');
    case 'boolean':
      return f.flowType('boolean');
    case 'null':
      return f.flowType('null');
    default:
      return f.flowType('any');
  }
};