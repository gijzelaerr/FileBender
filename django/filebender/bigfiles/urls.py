from django.conf.urls.defaults import patterns
from django.conf import settings

urlpatterns = patterns('',
    (r'^list/$', 'bigfiles.views.listfiles'),
    (r'^download/(?P<bigfileid>\d+)/(?P<secret>\w{%i})/$'
        % settings.FILE_SECRET_LENGTH, 'bigfiles.views.download'),
    (r'^append.json/(?P<bigfileid>\d+)/$', 'bigfiles.views.append'),
    (r'^delete/(?P<bigfileid>\d+)/$', 'bigfiles.views.delete'),
    (r'^upload/$', 'bigfiles.views.upload'),
    (r'^upload.json/$', 'bigfiles.views.upload', {'json': True}),
    (r'^$', 'bigfiles.views.listfiles'),
)
