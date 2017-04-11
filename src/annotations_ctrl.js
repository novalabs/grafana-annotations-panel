import config from 'app/core/config';
import {PanelCtrl} from 'app/plugins/sdk';
import './css/annotations-panel.css!';
import angular from 'angular';


const annotationDefaults = {
    timestamp: "",
    title: "",
    tags: "",
    text: "",
};


const editorDefaults = {
    measurement: "events",
    tagsColumn: "tags",
    textColumn: "text",
    titleColumn: "title",
}


export class AnnotationsCtrl extends PanelCtrl {

    constructor($scope, $injector, $http, datasourceSrv, backendSrv, alertSrv) {
        super($scope, $injector);
        _.defaults(this.panel, annotationDefaults, editorDefaults);

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
                this.selectedDatasource = this.availableDatasources[1];
            });

        this.annotation = annotationDefaults;
        this.editor = editorDefaults;

    }

    onSubmit() {
        var query = this.buildQuery();
        console.log("query: "+query);
        this.writeData(query);
    }

    buildQuery() {
        // timestamp
        var timestamp = this.annotation.timestamp;
        if(timestamp == "") {
            timestamp = this.getNow();
        }
        // tags
        var tags = this.annotation.tags.replace(/,/g, "\\,");

        return "" + this.editor.measurement + "," + this.editor.tagsColumn + "=" + tags + " " + this.editor.titleColumn + "=\"" + this.annotation.title + "\"," + this.editor.textColumn + "=\"" + this.annotation.text + "\" " + timestamp;
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

    setNow() {
        this.annotation.timestamp = this.getNow();
    }

    getNow() {
        return new Date().getTime()*1000000;
    }

    onInitEditMode() {
        this.addEditorTab('Annotations Options', 'public/plugins/novalabs-annotations-panel/editor.html', 2);
    }

    onPanelTeardown() {
        this.$timeout.cancel(this.nextTickPromise);
    }
}

AnnotationsCtrl.templateUrl = 'module.html';
