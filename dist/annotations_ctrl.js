'use strict';

System.register(['app/core/config', 'app/plugins/sdk', './css/annotations-panel.css!', 'angular', 'moment', './input_datetime'], function (_export, _context) {
    "use strict";

    var config, PanelCtrl, angular, moment, inputDatetimeDirective, _createClass, moduleDefaults, editorDefaults, AnnotationsCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appCoreConfig) {
            config = _appCoreConfig.default;
        }, function (_appPluginsSdk) {
            PanelCtrl = _appPluginsSdk.PanelCtrl;
        }, function (_cssAnnotationsPanelCss) {}, function (_angular) {
            angular = _angular.default;
        }, function (_moment) {
            moment = _moment.default;
        }, function (_input_datetime) {
            inputDatetimeDirective = _input_datetime.inputDatetimeDirective;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            moduleDefaults = {
                time: "",
                title: "",
                tags: "",
                text: ""
            };
            editorDefaults = {
                measurement: "events",
                tagsColumn: "tags",
                textColumn: "text",
                titleColumn: "title"
            };

            _export('AnnotationsCtrl', AnnotationsCtrl = function (_PanelCtrl) {
                _inherits(AnnotationsCtrl, _PanelCtrl);

                function AnnotationsCtrl($scope, $injector, $http, datasourceSrv, backendSrv, alertSrv) {
                    _classCallCheck(this, AnnotationsCtrl);

                    var _this = _possibleConstructorReturn(this, (AnnotationsCtrl.__proto__ || Object.getPrototypeOf(AnnotationsCtrl)).call(this, $scope, $injector));

                    _.defaults(_this.panel, moduleDefaults, editorDefaults);

                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
                    _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));

                    _this.alertSrv = alertSrv;
                    _this.backendSrv = backendSrv;
                    _this.datasourceSrv = datasourceSrv;
                    _this.$http = $http;

                    // get influx datasources
                    _this.backendSrv.get('/api/datasources').then(function (result) {
                        _this.availableDatasources = _.filter(result, { "type": "influxdb" });
                        _this.selectedDatasource = _this.availableDatasources[1];
                    });

                    _this.module = moduleDefaults;
                    _this.editor = editorDefaults;

                    return _this;
                }

                _createClass(AnnotationsCtrl, [{
                    key: 'onSubmit',
                    value: function onSubmit() {
                        var query = this.buildQuery();
                        console.log("query: " + query);
                        this.writeData(query);
                    }
                }, {
                    key: 'buildQuery',
                    value: function buildQuery() {

                        // timestamp
                        var timestamp = "";
                        if (this.module.time != "" && typeof this.module.time != 'undefined') {
                            var js = this.getMoment(this.module.time);
                            timestamp = this.getInfluxTimestamp(js);
                        }

                        // tags
                        var tags = this.module.tags.replace(/,/g, "\\,");

                        return "" + this.editor.measurement + "," + this.editor.tagsColumn + "=" + tags + " " + this.editor.titleColumn + "=\"" + this.module.title + "\"," + this.editor.textColumn + "=\"" + this.module.text + "\" " + timestamp;
                    }
                }, {
                    key: 'writeData',
                    value: function writeData(query) {
                        var _this2 = this;

                        console.log("WRITE", query);
                        this.error = null;
                        return this.datasourceSrv.get(this.selectedDatasource.name).then(function (ds) {
                            _this2.$http({
                                url: ds.urls[0] + '/write?db=' + ds.database,
                                method: 'POST',
                                data: query,
                                headers: {
                                    "Content-Type": "plain/text"
                                }
                            }).then(function (rsp) {
                                console.log("Annotation saved", rsp);
                                _this2.alertSrv.set('Saved', 'Successfully saved the annotation', 'success', 3000);
                            }, function (err) {
                                console.log("ERROR", err);
                                _this2.error = err.data.error + " [" + err.status + "]";
                                _this2.alertSrv.set('Oops', 'Something went wrong: ' + _this2.error, 'error', 6000);
                            });
                        });
                    }
                }, {
                    key: 'changeTime',
                    value: function changeTime() {
                        var picked = this.dashboard.isTimezoneUtc() ? moment().utc(this.datapicked) : moment(this.datapicked);

                        // set current time to picked date
                        var now = this.dashboard.isTimezoneUtc() ? moment().utc() : moment();
                        picked = picked.hour(now.get('hour'));
                        picked = picked.minute(now.get('minute'));
                        picked = picked.second(now.get('second'));

                        this.module.time = picked.format("YYYY-MM-DD HH:mm:ss");
                    }
                }, {
                    key: 'getMoment',
                    value: function getMoment(jsDate) {
                        return this.dashboard.isTimezoneUtc() ? moment.utc(jsDate) : moment(jsDate);
                    }
                }, {
                    key: 'getInfluxTimestamp',
                    value: function getInfluxTimestamp(jsDate) {
                        return jsDate.valueOf() * 1000000;
                    }
                }, {
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('Annotations Options', 'public/plugins/novalabs-annotations-panel/editor.html', 2);
                    }
                }, {
                    key: 'onPanelTeardown',
                    value: function onPanelTeardown() {
                        this.$timeout.cancel(this.nextTickPromise);
                    }
                }]);

                return AnnotationsCtrl;
            }(PanelCtrl));

            _export('AnnotationsCtrl', AnnotationsCtrl);

            AnnotationsCtrl.templateUrl = 'module.html';

            angular.module("grafana.directives").directive('inputSimpleDatetime', inputDatetimeDirective);
        }
    };
});
//# sourceMappingURL=annotations_ctrl.js.map
