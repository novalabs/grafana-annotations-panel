import config from 'app/core/config';
import {PanelCtrl} from 'app/plugins/sdk';
import './css/annotations-panel.css!';
import angular from 'angular';
import moment from 'moment';


// module.html default fields
const moduleDefaults = {
    time: "",
    title: "",
    tags: "",
    text: "",
};


// editor.html default fields
const editorDefaults = {
    measurement: "events",
    tagsColumn: "tags",
    textColumn: "text",
    titleColumn: "title",
}


export class AnnotationsCtrl extends PanelCtrl {

    constructor($scope, $injector, $http, datasourceSrv, backendSrv, alertSrv) {
        super($scope, $injector);
        _.defaults(this.panel, moduleDefaults, editorDefaults);

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));

        this.alertSrv = alertSrv;
        this.backendSrv = backendSrv;
        this.datasourceSrv = datasourceSrv;
        this.$http = $http;

        // get influx datasources
        this.backendSrv.get('/api/datasources')
            .then((result) => {
                this.availableDatasources = _.filter(result, {"type": "influxdb"});
                this.selectedDatasource = this.availableDatasources[0];
            });

        this.module = moduleDefaults;
        this.editor = editorDefaults;

    }


    onSubmit() {
        var query = this.buildQuery();
        console.log("query: "+query);
        this.writeData(query);
    }


    buildQuery() {

        // timestamp
        var timestamp = "";
        if(this.module.time != "" && typeof this.module.time != 'undefined') {
            var js = this.getMoment(this.module.time);
            timestamp = this.getInfluxTimestamp(js);
        }

        var title = this.module.title || "my annotation";
        var text = this.module.text || "no description";

        // tags
        var tagsInQuery = "";
        if(this.module.tags != "" && typeof this.module.tags != 'undefined') {
            // replace ", " and "," and " "
            var tags = this.module.tags.replace(/,\s|,|\s/g, "\\,");
            tagsInQuery = "," + this.editor.tagsColumn + "=" + tags;
        }
        return "" + this.editor.measurement + tagsInQuery + " " + this.editor.titleColumn + "=\"" + title + "\"," + this.editor.textColumn + "=\"" + text + "\" " + timestamp;

    }


    writeData(query) {
        console.log( "WRITE", query );
        this.error = null;
        return this.datasourceSrv.get(this.selectedDatasource.name).then( (ds) => {
            this.$http({
                url: ds.urls[0] + '/write?db=' + ds.database,
                method: 'POST',
                data: query,
                headers: {
                    "Content-Type": "plain/text"
                }
            }).then((rsp) => {
                console.log( "Annotation saved", rsp );
                this.alertSrv.set('Saved', 'Successfully saved the annotation', 'success', 3000);
            }, err => {
                console.log( "ERROR", err );
                this.error = err.data.error + " ["+err.status+"]";
                this.alertSrv.set('Oops', 'Something went wrong: '+this.error, 'error', 6000);
            });
        });
    }


    changeTime() {
        var picked = this.dashboard.isTimezoneUtc() ? moment().utc(this.datapicked) : moment(this.datapicked);

        // set current time to picked date
        var now = this.dashboard.isTimezoneUtc() ? moment().utc() : moment();
        picked = picked.hour(now.get('hour'));
        picked = picked.minute(now.get('minute'));
        picked = picked.second(now.get('second'));

        this.module.time = picked.format("YYYY-MM-DD HH:mm:ss");
    }


    getMoment(jsDate) {
        return this.dashboard.isTimezoneUtc() ? moment.utc(jsDate) : moment(jsDate);
    }


    getInfluxTimestamp(jsDate) {
        return jsDate.valueOf()*1000000;
    }


    onInitEditMode() {
        this.addEditorTab('Annotations Options', 'public/plugins/novalabs-annotations-panel/editor.html', 2);
    }


    onPanelTeardown() {
        this.$timeout.cancel(this.nextTickPromise);
    }


}


AnnotationsCtrl.templateUrl = 'module.html';

import {inputDatetimeDirective} from './input_datetime';
angular.module("grafana.directives").directive('inputSimpleDatetime', inputDatetimeDirective);