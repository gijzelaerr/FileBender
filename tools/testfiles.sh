#!/bin/bash

dd if=/dev/urandom of=1MB.dat bs=1M count=1
dd if=/dev/urandom of=5MB.dat bs=1M count=5
dd if=/dev/urandom of=50MB.dat bs=1M count=50
dd if=/dev/urandom of=500MB.dat bs=1M count=500
dd if=/dev/urandom of=4GB.dat bs=1M count=4000
