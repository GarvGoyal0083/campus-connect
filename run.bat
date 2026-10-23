@echo off
title CampusConnect - AI Campus Maintenance Ticket System
echo Starting CampusConnect Server on http://localhost:5000 ...
start "" "http://localhost:5000"
node "%~dp0backend\server.js"
pause
