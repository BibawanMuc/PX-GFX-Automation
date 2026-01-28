{
    function scriptMain(thisObj) {
        function getStructure(rowString) {
            return rowString.split("\t");
        }

        function trimString(str) {
            return str.replace(/^\s+|\s+$/g, '');
        }

        function findItemByName(name) {
            for (var i = 1; i <= app.project.numItems; i++) {
                if (app.project.item(i).name === name && app.project.item(i) instanceof CompItem) {
                    return app.project.item(i);
                }
            }
            return null;
        }

        function importFootage(path) {
            try {
                var file = new File(path);
                if (!file.exists) return null;
                var importOptions = new ImportOptions(file);
                // Force alphabetical order to avoid confusion? No.
                return app.project.importFile(importOptions);
            } catch (e) {
                return null;
            }
        }

        function process() {
            var file;
            if (typeof GLOBAL_JOB_FILE !== 'undefined') {
                file = new File(GLOBAL_JOB_FILE);
            } else {
                file = File.openDialog("Select the text file to process");
            }

            if (!file || !file.exists) return;

            file.open("r");
            var content = file.read();
            file.close();

            var lines = content.split(/\r\n|\r|\n/);
            if (lines.length < 2) return;

            var headers = getStructure(lines[0]);
            var colMap = {};
            for (var j = 0; j < headers.length; j++) {
                colMap[trimString(headers[j])] = j;
            }

            app.beginUndoGroup("Process Text to Layers");

            var processingFolder = app.project.items.addFolder("Render_Queue_Processed");

            for (var i = 1; i < lines.length; i++) {
                var line = lines[i];
                if (trimString(line) === "") continue;

                var data = getStructure(line);

                function getVal(colName) {
                    if (colMap[colName] !== undefined && data[colMap[colName]]) {
                        return trimString(data[colMap[colName]]);
                    }
                    return "";
                }

                var templateName = getVal("Comp");
                var newCompName = getVal("NewComp") || getVal("Output");

                if (!templateName || !newCompName) continue;

                var templateComp = findItemByName(templateName);
                if (!templateComp) continue;

                // --- DATA MAPPING ---
                var textLayerMap = { "Titel1": "Titel1", "Titel2": "Titel2", "TuneIn": "TuneIn" };
                var footageLayerMap = { "Video": "Video", "Packshot": "Packshot" };

                // --- ROBUST DEEP DUPLICATION ---
                // We use a cache to map OriginalID -> NewItem for THIS job iteration.
                // This ensures that if "PrecompA" is used twice in the template, 
                // it is duplicated ONCE (as "PrecompA_Copy"), and both layers point to "PrecompA_Copy".
                var jobCache = {};

                function duplicateHierarchy(sourceItem, suffix) {
                    // 1. CHECK CACHE
                    if (jobCache[sourceItem.id]) {
                        return jobCache[sourceItem.id];
                    }

                    // 2. DUPLICATE
                    var newItem = sourceItem.duplicate();
                    newItem.name = sourceItem.name + "_" + suffix;
                    newItem.parentFolder = processingFolder;
                    jobCache[sourceItem.id] = newItem;

                    // 3. PROCESS CONTENTS (Layers)
                    // Only applicable if it is a CompItem
                    if (newItem instanceof CompItem) {
                        for (var k = 1; k <= newItem.numLayers; k++) {
                            try {
                                var layer = newItem.layer(k);
                                if (layer.locked) layer.locked = false;

                                // A. UPDATE CONTENT (Text/Footage) inside this new comp
                                // Text
                                for (var textKey in textLayerMap) {
                                    if (layer.name === textKey) {
                                        var newText = getVal(textLayerMap[textKey]);
                                        if (newText) {
                                            var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
                                            var textDoc = textProp.value;
                                            textDoc.text = newText;
                                            textProp.setValue(textDoc);
                                        }
                                    }
                                }

                                // Footage
                                for (var footageKey in footageLayerMap) {
                                    if (layer.name === footageKey) {
                                        var filePath = getVal(footageLayerMap[footageKey]);
                                        if (filePath) {
                                            var importedItem = importFootage(filePath);
                                            if (importedItem) layer.replaceSource(importedItem, false);
                                        }
                                    }
                                }

                                // B. RECURSE IF SOURCE IS COMP
                                if (layer.source && layer.source instanceof CompItem) {
                                    // Recurse: Get (or create) the duplicate of the source
                                    var newSource = duplicateHierarchy(layer.source, suffix);

                                    // Replace: Point this layer to the duplicate
                                    if (newSource.id !== layer.source.id) {
                                        layer.replaceSource(newSource, false);
                                    }
                                }

                            } catch (err) {
                                // Swallow error to prevent crash
                            }
                        }
                    }

                    return newItem;
                }

                // START PROCESS
                // We create a unique suffix for this job to keep naming clean
                var jobSuffix = newCompName; // + "_" + i; // Or just use the output name

                var mainDuplicate = duplicateHierarchy(templateComp, jobSuffix);

                // Rename the main root exactly what we want (override the suffix logic)
                mainDuplicate.name = newCompName;

                // --- ADD TO RENDER QUEUE ---
                var rqItem = app.project.renderQueue.items.add(mainDuplicate);

                // Determine Output Path relative to Project File location
                // Project: .../dashboard/_AE Projekte/SYFY.aep
                // Render:  .../dashboard/_Renderings


                var renderFolder = null;

                // 1. Try Global Path (from API)
                if (typeof GLOBAL_DASHBOARD_PATH !== 'undefined' && GLOBAL_DASHBOARD_PATH) {
                    renderFolder = new Folder(GLOBAL_DASHBOARD_PATH + "/_Renderings");
                }
                // 2. Fallback to Relative Path (if project saved)
                else if (app.project.file) {
                    var projectFolder = app.project.file.parent;
                    var dashboardFolder = projectFolder.parent;
                    renderFolder = new Folder(dashboardFolder.fsName + "/_Renderings");
                }

                if (renderFolder) {

                    if (!renderFolder.exists) renderFolder.create();

                    var outputPath = renderFolder.fsName + "/" + newCompName;

                    // Set Output Module File
                    rqItem.outputModule(1).file = new File(outputPath);
                }
            }

            app.endUndoGroup();

            // --- DEEP DEBUG LOGGING ---
            function logToDisk(msg) {
                try {
                    var logPath = "d:/ae_script_debug.txt"; // Fallback

                    if (typeof GLOBAL_DASHBOARD_PATH !== 'undefined' && GLOBAL_DASHBOARD_PATH) {
                        logPath = GLOBAL_DASHBOARD_PATH + "/tmp/ae_script_debug.txt";
                    } else if (app.project.file) {
                        // Attempt to find tmp folder relative to project
                        var projectFolder = app.project.file.parent;
                        var dashboardFolder = projectFolder.parent;
                        logPath = dashboardFolder.fsName + "/tmp/ae_script_debug.txt";
                    }

                    var logFile = new File(logPath);
                    logFile.open("a");
                    var now = new Date();
                    logFile.writeln(now.toTimeString() + ": " + msg);
                    logFile.close();
                } catch (e) { }
            }

            // --- RENDER & SAVE & QUIT ---
            app.beginSuppressDialogs();
            logToDisk("Starting Render Phase...");

            try {
                // 1. Render
                if (app.project.renderQueue.numItems > 0) {
                    logToDisk("Queue has " + app.project.renderQueue.numItems + " items. Rendering...");
                    app.project.renderQueue.render();
                    logToDisk("Render Complete.");
                } else {
                    logToDisk("Render Queue empty!");
                }

                // 2. Save Project Version
                if (app.project.file) {
                    var now = new Date();
                    var dateStr = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear();
                    var timeStr = now.getHours() + "-" + now.getMinutes() + "-" + now.getSeconds();

                    var origName = app.project.file.name.replace(".aep", "");
                    var newName = origName + "_" + dateStr + "_" + timeStr + ".aep";
                    var targetSavePath = app.project.file.parent.fsName + "/" + newName;

                    logToDisk("Saving to: " + targetSavePath);

                    var newFile = new File(targetSavePath);
                    app.project.save(newFile);
                    logToDisk("Save Successful.");
                }

            } catch (e) {
                logToDisk("CRITICAL ERROR: " + e.toString());
            } finally {
                logToDisk("Quitting After Effects...");
                app.endSuppressDialogs(false);
                app.quit();
            }
        }

        process();
    }

    scriptMain(this);
}