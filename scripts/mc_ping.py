import socket, struct, json, sys
def vi(n):
    o=b""
    while True:
        b=n&0x7f; n>>=7
        o+=bytes([b|(0x80 if n else 0)])
        if not n: return o
def rvi(s):
    n=0;sh=0
    while True:
        b=s.recv(1)[0]; n|=(b&0x7f)<<sh; sh+=7
        if not b&0x80: return n
h,p=sys.argv[1],int(sys.argv[2])
s=socket.create_connection((h,p),timeout=8)
d=vi(0)+vi(763)+vi(len(h))+h.encode()+struct.pack(">H",p)+vi(1)
s.sendall(vi(len(d))+d); s.sendall(b"\x01\x00")
rvi(s); rvi(s); l=rvi(s); buf=b""
while len(buf)<l: buf+=s.recv(l-len(buf))
j=json.loads(buf); pl=j.get("players",{})
print("ONLINE", pl.get("online"), "/", pl.get("max"), [x.get("name") for x in pl.get("sample",[]) or []])
