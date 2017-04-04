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
    datasources: ["influxdb"],
    datasource: "influxdb",
    measurement: "events",
    tagsColumn: "tags",
    textColumn: "text",
    titleColumn: "title",
}


export class AnnotationsCtrl extends PanelCtrl {

    constructor($scope, $injector, $http, datasourceSrv) {
        super($scope, $injector);
        _.defaults(this.panel, annotationDefaults, editorDefaults);

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));

        this.datasourceSrv = datasourceSrv;
        this.$http = $http;


        console.log(annotationDefaults);
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
        return this.datasourceSrv.get(this.panel.datasource).then( (ds) => {
            this.$http({
                url: ds.urls[0] + '/write?db=' + ds.database,
                method: 'POST',
                data: query,
                headers: {
                    "Content-Type": "plain/text"
                }
            }).then((rsp) => {
                console.log( "OK", rsp );
            }, err => {
                console.log( "ERROR", err );
                this.error = err.data.error + " ["+err.status+"]";
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
        this.addEditorTab('Annotations_Options', 'public/plugins/novalabs-annotations-panel/editor.html', 2);
    }

    onPanelTeardown() {
        this.$timeout.cancel(this.nextTickPromise);
    }
}

AnnotationsCtrl.templateUrl = 'module.html';
