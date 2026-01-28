// test_unified.jsx
// 1. Check/Open Project
var targetProject = new File("d:/PX KI Event/PROJECT/CODE/GFX_LINK/_AE Projekte/SYFY.aep");

if (app.project.file == null || app.project.file.fsName != targetProject.fsName) {
    if (targetProject.exists) {
        app.open(targetProject);
    } else {
        alert("Project file not found: " + targetProject.fsName);
    }
}

// 2. Run Automation Logic (Simple Alert for test)
alert("Unified Launch SUCCESS!\nProject should be open.\nScript is running.");
