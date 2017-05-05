'use strict';

System.register(['moment'], function (_export, _context) {
  "use strict";

  var moment;
  function inputDatetimeDirective() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function link($scope, $elem, attrs, ngModel) {

        var formats = ["YYYY-MM-DD HH:mm:ss", "YYYY/MM/DD HH:mm:ss"];

        var fromUser = function fromUser(text) {

          var parsed;
          parsed = moment(text, formats, true);

          if (text != "" && !parsed.isValid()) {
            ngModel.$setValidity("error", false);
            return undefined;
          }

          ngModel.$setValidity("error", true);
          //return parsed;
          return text;
        };

        //      var toUser = function (currentValue) {
        //        if (moment.isMoment(currentValue)) {
        //          return currentValue.format(format);
        //        } else {
        //          return currentValue;
        //        }
        //      };

        ngModel.$parsers.push(fromUser);
        //      ngModel.$formatters.push(toUser);
      }
    };
  }

  _export('inputDatetimeDirective', inputDatetimeDirective);

  return {
    setters: [function (_moment) {
      moment = _moment.default;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=input_datetime.js.map
