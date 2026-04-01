---
title: Powershell one-liner to check the time on a bunch of servers for DST
author: Jonathan Walz
authors:
  - Jonathan Walz
date: "2007-03-09T19:26:41+00:00"
aliases:
  - /2007/03/powershell-one-liner-to-check-the-time-on-a-bunch-of-servers-for-dst/
---

Over the weekend I need to check a bunch of servers (mostly Domain Controllers) to see if the DST (Daylight Savings Time) change occurs correctly.Â  I decided to see how I could do it in Powershell and this is what I came up with:Â   
Get-Content servers.txt | %{$x = net time \$_; $x[0];If($x[2].contains("Local")){$x[2]}} | Add-Content Servertime.txt  
This is a line of Powershell code that will open servers.txt (which is just a list of servers) and for each server it will run the "net time" command.Â  IÂ pass the first line of theÂ output of the "net time" commandÂ $x[0] and check to seeÂ if the third line contains "Local".Â  If it does I pass that line as well (Â to see the local time on the servers that are not in my timezone.)Â  I then send this to Servername.txt  
Quick, easy one line of code.Â  You've gotta love Powershell!Â  Thanks Microsoft
