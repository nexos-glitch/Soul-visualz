        unprecompBtn.onClick = function () {
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) { alert("No active composition."); return; }
            var layers = comp.selectedLayers;
            if (layers.length === 0) { alert("Select a precomp layer first."); return; }

            var precompLayers = [];
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].source instanceof CompItem) precompLayers.push(layers[i]);
            }
            if (precompLayers.length === 0) { alert("Selected layer(s) are not precomps."); return; }

            app.beginUndoGroup("Unprecomp");

            for (var pi = 0; pi < precompLayers.length; pi++) {
                var precompLayer = precompLayers[pi];
                var precomp      = precompLayer.source;

                // Where precomp's local time=0 maps to in the parent comp.
                // displayStartTime is non-zero only if "Start Frame" is set in Comp Settings.
                var timeOffset = precompLayer.startTime - precomp.displayStartTime;
                var precompIn  = precompLayer.inPoint;
                var precompOut = precompLayer.outPoint;

                // ---- Snapshot all inner layers BEFORE any copyToComp call ----
                // copyToComp inserts at index 1 each time, shifting all other indices.
                // We capture the OBJECT REFERENCE (not the index) so iteration stays correct.
                var snaps = [];
                for (var k = 1; k <= precomp.numLayers; k++) {
                    var sl = precomp.layer(k);
                    snaps.push({
                        ref:       sl,              // stable object reference
                        origIdx:   k,               // original index, for parent mapping
                        st:        sl.startTime,    // precomp-local: source frame-0 position
                        ip:        sl.inPoint,      // precomp-local trim in
                        op:        sl.outPoint,     // precomp-local trim out
                        parentIdx: sl.parent ? sl.parent.index : null
                    });
                }

                // ---- Extract and re-time each layer ----
                var idxMap    = {};  // origIdx -> new layer in parent comp
                var extracted = [];

                for (var k = 0; k < snaps.length; k++) {
                    var sn = snaps[k];

                    // Copy layer into parent comp (lands at index 1)
                    sn.ref.copyToComp(comp);
                    var nl = comp.layer(1);

                    idxMap[sn.origIdx] = nl;
                    extracted.push({ sn: sn, nl: nl });

                    // Convert precomp-local times to parent-comp times
                    var newST = sn.st + timeOffset;
                    var newIP = sn.ip + timeOffset;
                    var newOP = sn.op + timeOffset;

                    // Clamp trim to the precomp layer's visible window in the parent
                    newIP = Math.max(newIP, precompIn);
                    newOP = Math.min(newOP, precompOut);
                    if (newIP >= newOP) newOP = newIP + (1 / comp.frameRate);

                    // IMPORTANT: set startTime FIRST.
                    // In AE, setting startTime slides the whole layer bar (including inPoint/outPoint).
                    // The layer arrives from copyToComp with precomp-local times, so we must shift
                    // startTime by exactly timeOffset to move the bar to the right position,
                    // then override inPoint/outPoint with the clamped values.
                    nl.startTime = newST;
                    nl.inPoint   = newIP;
                    nl.outPoint  = newOP;

                    nl.moveBefore(precompLayer);
                }

                // ---- Control Null: carries the precomp layer's spatial transform ----
                var ctrlNull = comp.layers.addNull();
                ctrlNull.name      = precompLayer.name + " [ctrl]";
                ctrlNull.startTime = precompLayer.startTime;
                ctrlNull.inPoint   = precompIn;
                ctrlNull.outPoint  = precompOut;
                ctrlNull.moveBefore(precompLayer);

                // Helper: copy a property (handles both static and keyframed values)
                function copyProp(src, dst) {
                    if (!src || !dst) return;
                    try {
                        if (src.numKeys > 0) {
                            for (var ki = 1; ki <= src.numKeys; ki++) {
                                dst.setValueAtTime(src.keyTime(ki), src.keyValue(ki));
                                try {
                                    dst.setInterpolationTypeAtKey(ki,
                                        src.keyInInterpolationType(ki),
                                        src.keyOutInterpolationType(ki));
                                } catch(e) {}
                            }
                        } else {
                            dst.setValue(src.value);
                        }
                    } catch(e) {}
                }

                var xf = precompLayer.property("Transform");
                var cf = ctrlNull.property("Transform");
                var props2D = ["Anchor Point", "Position", "Scale", "Rotation", "Opacity"];
                for (var p = 0; p < props2D.length; p++) {
                    try { copyProp(xf.property(props2D[p]), cf.property(props2D[p])); } catch(e) {}
                }
                if (precompLayer.threeDLayer) {
                    ctrlNull.threeDLayer = true;
                    var props3D = ["X Rotation", "Y Rotation", "Orientation"];
                    for (var p = 0; p < props3D.length; p++) {
                        try { copyProp(xf.property(props3D[p]), cf.property(props3D[p])); } catch(e) {}
                    }
                }

                // ---- Restore parenting ----
                // Layers that had a parent inside the precomp get re-parented to their mapped layer.
                // Root layers (no parent in precomp) attach to the control null.
                for (var i = 0; i < extracted.length; i++) {
                    var sn = extracted[i].sn;
                    var nl = extracted[i].nl;
                    if (sn.parentIdx !== null && idxMap[sn.parentIdx]) {
                        nl.parent = idxMap[sn.parentIdx];
                    } else {
                        nl.parent = ctrlNull;
                    }
                }

                precompLayer.remove();
            }

            app.endUndoGroup();
        };
