---
title: Episode 61 – Joe Pruitt from F5 and the ABCs of PowerShell
author: Jonathan Walz
authors:
  - Jonathan Walz
date: "2009-03-03T03:25:07+00:00"
podcast_url: "http://media.libsyn.com/media/powerscripting/PSPodcast-061.mp3"
aliases:
  - /2009/03/episode-61-joe-pruitt-from-f5-and-the-abcs-of-powershell/
---

**A Podcast about Windows PowerShell.**  
Listen: [**![](http://powerscripting.libsyn.com/img/podcastIcon.gif)**][1]  






## 
    In This Episode





    Tonight on the PowerScripting Podcast we talk with developer and blogger Joe Pruitt from F5 Networks.




## 
    News





    *






        This segment is brought to you byÂ [SAPIEN Technologies](http://sapien.com/).





        Â 







      *






          Â 





          - 
            PowerGui 1.7
Â 
[has been released](http://dmitrysotnikov.wordpress.com/2009/02/26/whats-new-in-powergui-17/)


          - 
            Quest has
Â 
[put up a survey](http://dmitrysotnikov.wordpress.com/2009/02/22/powergui-org-survey/)
Â 
to help determine the direction of PowerGUI


          - 
            Don Jones
Â 
[has offered to review](http://concentratedtech.com/content/index.php/2009/01/powershell-script-reviews-your-scripts-wanted/)
Â 
submitted scripts


          - 
            Jeffrey Snover recently
Â 
[weighed in](http://stackoverflow.com/questions/573623/powershell-vs-unix-shells/573861#573861)
Â 
on a StackOverflow question on
Â 
[PowerShell vs Unix Shells](http://stackoverflow.com/questions/573623/powershell-vs-unix-shells)


          - 
            Jeff Hicks
Â 
[posted a reminder](http://blog.sapien.com/index.php/2009/02/24/powershell-fundamentals-online-class-starting-soon/)
Â 
that Sapien has a new round of online PowerShell fundamentals classes starting March 10th


          - 
            SAPIEN has posted a clarification to their blog about the new
Â 
[PrimalScript and PrimalTools software](http://blog.sapien.com/index.php/2009/02/26/look-ma-no-editions/)










## 
          InterviewÂ 





          *




















Get on the fast track to PowerShell scripting success withÂ 
**
PowerGUI
**















JoinÂ 
**
PowerShell MVPs Dmitry Sotnikov and Kirk MunroÂ 
**
for a live chat atÂ 
**
Quest Connect,Â 
**
a free, on-demand virtual tradeshow where you can get the answers you need to solve your toughest PowerShell challenges








VisitÂ 


[
www.quest.com/poshchat
](http://www.quest.com/poshchat)


Â today to learn more and to register






                        Â 





                        Â 





                        Â 





                        - 
                          rfoust : ## what do you like the most about powershell?


                        - 
                          glnsize : ## what's your opinion of WS-MGMT?


                        - 
                          glnsize : ## how deep do you plan on going with your cmdlets? Â what percentage of your product line do you want to cover?


                        - 
                          ustreamer-61217 : ## will there be an update for v2?


                        - 
                          glnsize : ## Â doesn't that invalidate the whole perpose of SSL... not posh related but a pet peeve


                        - 
                          jonwalz-1 : ## there is a memory improvement technique that uses ABC lists. Is that where you got the idea for your lists?







                        Â 









                    *













## 
                          Resources





                          **




                            *This segment is brought to you by Idera:
 Want to make Windows PowerShell easier than ever to learn and master? Checkout Idera's PowerShellPlus Professional Edition which is now available for download! The new version has vastly improved code completion and a slick interactive Learning Center. Go toÂ *[*www.idera.com/PodcastPeople*](http://www.idera.com/PodcastPeople)*Â to get your copy today!*





                            **





                            **
 ****





                            **




                              **





                              Â 





                              - 
                                Better
Â 
[Warcraft gear script](http://www.ericwoodford.com/better-warcraft-gear-script-version-2)


                              - 
                                Lee shows us how to
Â 
[move or delete a really locked file](http://www.leeholmes.com/blog/MovingAndDeletingReallyLockedFilesInPowerShell.aspx)


                              - 
                                Karl shows us how to search the PoshCode repository
Â 
[directly from Windows 7](http://karlprosser.com/coder/2009/02/16/searching-poshcode-repository-from-your-desktop-in-windows-7/)


                              - 
                                Don Jones' Code Review #1:
Â 
[server audit script](http://concentratedtech.com/content/index.php/2009/01/script-review-1/)


                              - 
                                A script to tell you if a
Â 
[partition is aligned or not](http://ict-freak.nl/2009/02/23/powershell-check-if-partition-is-aligned-or-not/)


                              - 
                                Doug has published a script to
Â 
[grab data from a Google Docs spreadsheet](http://dougfinke.com/blog/index.php/2009/02/22/powershell-get-googlespreadsheets/)


                              - 

ShayÂ 

shows us how

Â to
Â 

[create a web client request](http://stackoverflow.com/questions/571429/powershell-web-requests-and-proxies/573414#573414)

Â 
using default net credentials and web proxy




                              - 

JoelÂ 

shows us how

Â to
Â 

[cleanly parse NETSH DHCP SERVER](http://www.powershellcommunity.org/Forums/tabid/54/aff/1/aft/3674/afv/topic/afpgj/1/Default.aspx#4356)

Â 
output using PowerShell










                                Â 








## 
                                Tips

Â 







                                Â 





                                - 
                                  "[Four for loops and their timings](http://dougfinke.com/blog/index.php/2009/02/20/powershell-four-for-loops-and-their-timings/)" blog post











## 
                                Mailbag






Author : Vivek K.




                                > 

> 
"I have been listening to your postcast's and you guys are doing great job.


Here is something I want to share as a single liner 🙂


I have text file with the name text1.txt, text2.txt and so on..


I have always been renaming these files manually for long time and now with Power (PowerShell) in my hand I do this..


Get-ChildItem *.txt | Rename-Item -NewName { $_.name -replace 'text(d+)', '$1.text'}


HTH for all those who come across situations when you want to rename such files.. this is for files with name starting with "text".. I am working on making this script as general as possible."

> 










 [1]: http://media.libsyn.com/media/powerscripting/PSPodcast-061.mp3
