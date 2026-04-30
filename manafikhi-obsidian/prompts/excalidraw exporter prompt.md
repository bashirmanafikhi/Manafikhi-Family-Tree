create a new service class like (excalidrawExporter) and put all the related logic inside it  
I want you to add a new feature in the web project only @contextScopeItemMention  
a button that export this current persons and all his decendants into an excalidraw format json so I can import that exported file in excalidraw.  
the canvas should draw all the generations starting from this current persons and the next generations  
each person should have a connected arrow or line that match him with all his children and parents  
use colors to make it easier to understand..  
when we press on the button a small modal should show to let the user configure some options of the drawing.  
for example:  
- Layout Algorithm or tree hieraricy shape.. vetical horizontal tree or radial  
- how many generations?  
- with or without rectangles?  
- include birthdates or other fields or not?  
- maybe something related to color options  
- more cinfigurations as you see is appropriate  
  
I have a concernt that sometimes it may export 1k+ persons.. so putting about 500 person in one row will make it hard and horizontally massive.  
maybe we should have options like writing names in radial format, and writing names in 45 or 90 angle, or maybe the angel can be relating to the center of the radial circle.. we can reduce the empty spaces as much as possible if we use angles  
النص المائل: يمكنك إضافة خاصية angle لكل عنصر نص في JSON. مثلاً، جعل النصوص تميل بزاوية 45 درجة يقلل العرض الأفقي للاسم بنسبة كبيرة ويسمح بتقريب الأسماء من بعضها (Compact Spacing).

  

نقاط الربط (Dots): بدلاً من المربع، يمكنك وضع دائرة صغيرة جداً (Circle) بقطر 5px بجانب الاسم، وتكون هي نقطة انطلاق الأسهم (Arrows). هذا يعطي مظهراً نظيفاً و"مينيمال".  
  
الأدوات المساعدة: يمكنك استخدام مكتبة @excalidraw/excalidraw إذا كنت تبني الأداة بـ React، فهي توفر وظائف مساعدة لتوليد العناصر برمجياً بدل كتابة الـ JSON يدوياً من الصفر.  
  
او ربما ايضاً تستطيع ان تستخدم مكتبة مثل D3-hierarchy هي تمتلك وظيفة جاهزة تسمى d3.tree().size([2 * Math.PI, radius]) تقوم بحساب كل الزوايا والإحداثيات لـ 1000 شخص في أجزاء من الثانية.