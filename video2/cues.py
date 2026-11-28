import json
O=.25;C=[]
def a(t,s,**k): C.append(dict(t=round(t+O,3),s=s,**k))
# A hook
a(-0.24,'slam'); a(-0.14,'thud',g=.6)
for k in range(6): a(-.2+k*.05,'pop_neg',i=k%4,g=.4,pan=(k-2.5)*.25)
for t0 in [0.0,1.64,3.47]: a(t0,'pop_pos',i=1,g=.6); a(t0+.55,'whoosh_down',d=.25,g=.7)
a(4.6,'whoosh_up',d=.3,g=.6); a(4.9,'boom'); a(4.95,'chime'); a(5.6,'sparkle',n=24,d=1.2)
# B
a(7.45,'whoosh_up',d=.4); for_ticks=[a(7.6+k*.1,'tick',g=.5) for k in range(14)]
a(9.17,'pop_neg'); a(9.4,'pop_neg',i=1,g=.6); a(9.6,'pop_neg',i=2,g=.6)
# C
a(10.95,'whoosh_up',d=.45); a(11.3,'pop_pos',i=3); a(12.0,'note',i=4)
for k in range(4): a(13.45+k*.18,'thud',g=.35)
a(14.45,'pop_neg',i=1)
# B2
a(15.6,'whoosh_up',d=.45); a(16.0,'thud',g=.7); a(17.23,'riser',d=1.1,g=.4)
for k in range(4): a(18.6+k*.08,'pop_pos',i=k,pan=(k-1.5)*.4,g=.7)
a(18.5,'click')
# C2
a(19.95,'whoosh_up',d=.45)
for k in range(6): a(20.3+k*.32,'note',i=[0,2,4,5,4,2][k],g=.6)
a(22.0,'riser',d=1.1,g=.4)
for k in range(4): a(23.4+k*.08,'pop_pos',i=k+1,pan=(k-1.5)*.4,g=.7)
# D
a(24.6,'whoosh_up',d=.5); a(24.95,'pop_pos',i=2); a(26.25,'pop_pos',i=4); a(27.6,'sparkle',n=12,d=.6)
a(29.7,'whoosh_up',d=.4,g=.5)
for k in range(8): a(31.1+k*.05,'pop_neg',i=k%4,g=.4)
a(31.4,'riser',d=.6,g=.4); a(32.0,'thud',g=.6); a(33.12,'whoosh_down',d=.6); a(33.3,'pop_pos',i=1); a(33.45,'pop_pos',i=3); a(33.9,'chime',g=.7)
# E
a(35.3,'whoosh_up',d=.5)
for k,t0 in enumerate([37.56,38.79,39.82,40.15]): a(t0,'pop_neg',i=k,pan=[-.5,.5,-.2,.2][k])
a(41.2,'whoosh_down',d=.5,g=.6); a(41.9,'riser',d=.65); a(42.55,'boom'); a(42.55,'shatter'); a(42.6,'chime'); a(42.6,'sparkle',n=40,d=1.5)
# F
a(43.9,'whoosh_up',d=.45)
for k in range(5): a(44.3+k*.16,'note',i=k,g=.5)
a(45.25,'pop_pos',i=5); a(45.27,'sparkle',n=20,d=.8); a(45.95,'whoosh_up',d=.4)
a(47.32,'stamp'); a(47.35,'pop_pos',i=3); a(47.98,'whoosh_up',d=.4)
a(48.35,'pop_pos',i=2); a(48.5,'whoosh_up',d=.5,g=.5,pan=.4); a(49.55,'pop_pos',i=4); a(49.7,'whoosh_up',d=.5,g=.5,pan=-.4); a(50.0,'sparkle',n=10,d=.5)
a(50.35,'whoosh_up',d=.4); a(50.7,'flip'); a(50.75,'flip',pan=.4); a(51.2,'whoosh_up',d=.4,g=.6); a(51.6,'chime'); a(51.6,'sparkle',n=24,d=1)
# G
a(52.95,'whoosh_up',d=.45); a(53.62,'whoosh_down',d=.25); a(53.85,'thud'); a(53.9,'pop_neg',g=.6); a(54.75,'flip'); a(54.8,'pop_pos',i=3)
a(55.4,'whoosh_up',d=.3,g=.5); a(56.3,'whoosh_up',d=.5,g=.6); a(56.6,'pop_neg',i=3)
a(57.5,'heart',g=.6); a(58.5,'heart',g=.6); a(59.0,'tick'); a(59.6,'tick'); a(60.0,'tick'); a(59.5,'heart',g=.6)
# H
a(60.8,'whoosh_up',d=.5); a(61.3,'whoosh_up',d=.6,g=.5); a(61.9,'thud',g=.7)
for k in range(8): a(61.5+k*.17,'step',i=k,g=.45)
a(62.9,'chime'); a(63.45,'whoosh_up',d=.3,g=.6); a(63.6,'riser',d=.4,g=.4); a(63.8,'sparkle',n=30,d=1.5)
a(65.2,'whoosh_down',d=.8)
for k in range(10): a(67.2+k*.18,'tick',g=.5)
# I
a(69.3,'whoosh_up',d=.5); a(70.2,'whoosh_down',d=1.0,g=.5)
for k in range(3): a(71.3+k*.1,'pop_neg',i=k,g=.6); a(72.9+k*.15,'pop_pos',i=k+2); a(72.9+k*.15,'shatter',g=.4)
a(72.7,'riser',d=2.2,g=.6)
a(75.04,'boom'); a(75.05,'whoosh_up',d=.5); a(75.6,'chime'); a(75.6,'sparkle',n=50,d=1.8)
json.dump(C,open('cues.json','w'));print(len(C))
