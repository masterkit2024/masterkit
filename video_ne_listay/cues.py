import json
C=[]
def a(t,s,**k): C.append(dict(t=round(t,3),s=s,**k))
# A
for k in range(5): a(0.0+k*.035,'tick',g=.6)
a(0.18,'slam'); a(1.15,'click'); a(2.39,'whoosh_up',d=.4,g=.5)
for k in range(12): a(2.7+k*.27,'tick',g=.5)
a(6.35,'pop_pos',i=2); a(7.0,'stamp'); a(8.15,'pop_pos',i=1); a(8.3,'heart'); a(8.62,'heart')
a(8.85,'whoosh_down',d=.8)
# B
a(9.85,'pop_pos'); a(11.82,'pop_pos',i=3); a(12.0,'projector',d=8.2,g=.8); a(14.6,'whoosh_up',d=.7,g=.6)
a(16.74,'pop_neg',i=0); a(17.72,'pop_neg',i=1); a(19.17,'stamp'); a(19.2,'thud')
a(19.95,'whoosh_up',d=.55)
# C
for k in range(4): a(20.8+k*.08,'pop_neg',i=k,g=.6,pan=[-.6,-.3,.3,.6][k])
a(21.25,'blip',pan=-.3); a(21.5,'blip',pan=.3)
for k,(tt,p) in enumerate([(23.09,-.6),(24.25,.6),(25.63,-.3),(26.6,.3)]): a(tt,'pop_neg',i=k,pan=p); a(tt+.05,'thud',g=.6)
a(28.4,'whoosh_down',d=.5); a(28.5,'pop_pos'); a(29.54,'flip'); a(30.44,'flip'); a(31.1,'flip')
a(32.7,'whoosh_up',d=1.4,g=.6,pan=-.5); a(34.0,'whoosh_up',d=1.2,g=.7,pan=.3); a(35.5,'whoosh_down',d=.8,pan=.6)
a(36.3,'whoosh_up',d=.55)
# D
a(37.12,'click'); a(38.83,'sparkle',n=36,d=1.3); a(38.83,'riser',d=1.0,g=.5)
for k in range(10): a(38.85+k*.1,'tick',g=.6)
a(39.9,'boom',g=.8); a(41.88,'thud'); a(43.3,'burn',d=4.6,g=.8); a(45.87,'whoosh_down',d=.6); a(45.9,'thud'); a(47.24,'heart',g=.7)
# E
a(48.6,'heart'); a(49.4,'heart'); a(50.2,'heart'); a(51.0,'click'); a(51.9,'crack'); a(52.6,'shatter')
for tt,p in [(53.3,-.4),(53.95,.4),(55.1,0)]: a(tt,'pop_neg',pan=p,g=.7)
for k,(tt,p) in enumerate([(53.95,-.4),(54.75,.4),(56.0,0)]): a(tt,'pop_pos',i=k+2,pan=p); a(tt,'thud',g=.5)
a(56.95,'riser',d=.7); a(57.65,'boom'); a(57.65,'chime'); a(57.7,'sparkle',n=40,d=1.6)
for k in range(5): a(57.7+k*.07,'pop_pos',i=k,pan=(k-2)*.3,g=.6)
a(59.12,'pop_pos',i=4); a(59.2,'chime',g=.6); a(60.15,'whoosh_up',d=.55)
# F
a(60.7,'riser',d=2.6,g=.6); a(62.7,'sparkle',n=30,d=1.8)
for k in range(30): a(62.7+k*.065,'tick',g=.6)
a(64.6,'chime'); a(65.6,'pop_pos',i=3); a(67.13,'boom',g=.7); a(67.13,'sparkle',n=30,d=1.0); a(67.15,'chime')
a(68.5,'whoosh_up',d=.5); a(69.25,'boom',g=.8)
# G
a(69.55,'whoosh_up',d=.45); a(70.04,'chime',g=.7); a(71.75,'whoosh_up',d=.4)
for k in range(10): a(72.2+k*.17,'note',i=[0,2,4,2,5,4,2,4,7,5][k],pan=(k%2-.5)*.6)
a(73.8,'whoosh_up',d=.5); a(74.6,'pop_pos',i=4); a(74.65,'sparkle',n=16,d=1.2); a(76.25,'whoosh_up',d=.4)
for k in range(6): a(76.85+k*.3,'pop_pos',i=k%4,pan=(-1)**k*.4,g=.7)
for k in range(4): a(78.15+k*.08,'pop_pos',i=k+2,pan=[-.6,-.3,.3,.6][k])
a(78.9,'whoosh_up',d=.45)
for k in range(8): a(79.4+k*.26,'step',i=k,g=.6)
a(81.4,'whoosh_down',d=.6)
for k in range(5): a(82.4+k*.15,'pop_pos',i=k)
a(83.69,'whoosh_up',d=.3); a(83.95,'boom',g=.8); a(83.95,'chime'); a(84.0,'sparkle',n=30,d=1.4)
# H
a(85.9,'whoosh_up',d=.55); a(86.1,'note',i=4,g=.8); a(88.99,'thud',g=.6); a(89.5,'thud',g=.6); a(89.7,'pop_pos',i=1,g=.6)
a(91.3,'riser',d=.5,g=.5); a(92.05,'pop_neg'); a(92.3,'whoosh_down',d=.4); a(92.53,'pop_pos',i=3)
for k,(t0,t1,i0,i1) in enumerate([(89.05,89.5,-1,0),(92.6,93.0,0,1),(94.3,94.7,1,2),(95.9,96.3,2,3),(97.35,97.75,3,4)]+[(99.33+.16*(j-5),99.33+.16*(j-4),j-1,j) for j in range(5,15)]):
    a(t1,'step',i=k,g=.8)
a(101.05,'whoosh_down',d=.8)
for i in range(15): a(102.98+i*.14,'tick',g=.5)
a(102.98,'sparkle',n=40,d=2.2)
# I
a(105.9,'whoosh_up',d=.5); a(106.4,'boom'); a(106.4,'chime'); a(106.45,'sparkle',n=36,d=1.5)
a(108.31,'whoosh_down',d=.9)
for k in range(3): a(108.4+k*.1,'pop_pos',i=k); a(109.0+k*.15,'pop_pos',i=k+3,g=.7)
a(111.6,'whoosh_up',d=.6); a(111.9,'pop_pos',i=1); a(112.8,'whoosh_up',d=.7,pan=.5)
a(113.95,'whoosh_up',d=.3); a(114.3,'boom'); a(114.3,'chime'); a(114.35,'sparkle',n=40,d=1.6)
# J
a(116.0,'whoosh_down',d=.6); a(117.25,'pop_pos',i=5); a(118.0,'whoosh_up',d=.4)
for k in range(4): a(118.1+k*.1,'tick',g=.6)
json.dump(C,open('cues.json','w'));print(len(C))
