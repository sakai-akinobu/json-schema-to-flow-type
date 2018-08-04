'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.simplifySchema = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const resolveRef = (imports = {}) => value => {
  if (!_lodash2.default.isArray(value) && _lodash2.default.isObject(value)) {
    const ref = _lodash2.default.get(value, '$ref');

    if (_lodash2.default.isString(ref)) {
      const [importRef, keyPath] = _lodash2.default.split(ref, '#');

      const keyPathArr = _lodash2.default.drop(_lodash2.default.split(keyPath, '/'));

      if (_lodash2.default.isEmpty(importRef)) {
        if (_lodash2.default.isEmpty(keyPathArr)) {
          return {
            $ref: (imports['~'] || {}).id
          };
        }

        if (imports['#']) {
          return _lodash2.default.cloneDeep(_lodash2.default.get(imports['#'], keyPathArr));
        }

        if (keyPathArr.length === 2 && _lodash2.default.first(keyPathArr) === 'definitions') {
          return {
            $ref: _lodash2.default.last(keyPathArr)
          };
        }

        return _lodash2.default.cloneDeep(_lodash2.default.get(imports['~'], keyPathArr));
      }

      if (!_lodash2.default.has(imports, importRef)) {
        throw new Error(`missing import ${importRef}`);
      }

      return _lodash2.default.cloneDeepWith(_lodash2.default.get(imports[importRef], keyPathArr), resolveRef({
        '#': imports[importRef]
      }));
    }
  }
  return undefined;
};

const simplifySchema = exports.simplifySchema = (schema, imports) => _lodash2.default.cloneDeepWith(schema, resolveRef(_extends({}, imports || {}, {
  '~': schema
})));