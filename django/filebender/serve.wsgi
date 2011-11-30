import sys
import os
import os.path
import django.core.handlers.wsgi

here = os.path.dirname(__file__)
project = os.path.basename(here)
parent = os.path.join(here, "..")

sys.path.append(here)
sys.path.append(parent)

os.environ['DJANGO_SETTINGS_MODULE'] = project + '.settings'
application = django.core.handlers.wsgi.WSGIHandler()

