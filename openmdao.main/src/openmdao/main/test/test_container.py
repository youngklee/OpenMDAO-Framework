# pylint: disable-msg=C0111,C0103

import os.path
import sys
import unittest
import StringIO
import nose
import copy

from enthought.traits.api import TraitError, HasTraits

import openmdao.util.eggsaver as constants
from openmdao.main.container import Container, get_default_name
from openmdao.lib.api import Float
from openmdao.util.testutil import make_protected_dir

# Various Pickle issues arise only when this test runs as the main module.
# This is used to detect when we're the main module or not.
MODULE_NAME = __name__

class MyHasTraits(HasTraits):
    def __init__(self, *args, **kwargs):
        super(MyHasTraits, self).__init__(*args, **kwargs)
        self.add_trait('dyntrait', Float(9., desc='some desc'))


class MyContainer(Container):
    def __init__(self, *args, **kwargs):
        super(MyContainer, self).__init__(*args, **kwargs)
        self.add_trait('dyntrait', Float(9., desc='some desc'))


class ContainerTestCase(unittest.TestCase):

    def setUp(self):
        """This sets up the following hierarchy of Containers:
        
                       root
                       /  \
                     c1    c2
                          /  \
                        c21  c22
                             /
                          c221
                          /
                        number
        """
        
        self.root = Container()
        self.root.add('c1', Container())
        self.root.add('c2', Container())
        self.root.c2.add('c21', Container())
        self.root.c2.add('c22', Container())
        self.root.c2.c22.add('c221', Container())
        self.root.c2.c22.c221.add_trait('number', Float(3.14, iotype='in'))

    def tearDown(self):
        """this teardown function will be called after each test"""
        self.root = None

    #def test_set_source(self):
        #self.root.set_source('c2.c22.c221.number', 'c1.foo')
        #self.assertEqual(self.root._sources['c2.c22.c221.number'], 'c1.foo')
        #self.assertEqual(self.root.c2._sources['c22.c221.number'], 'parent.c1.foo')
        #self.assertEqual(self.root.c2.c22._sources['c221.number'], 'parent.parent.c1.foo')
        #self.assertEqual(self.root.c2.c22.c221._sources['number'], 'parent.parent.parent.c1.foo')
        
    
    def test_deepcopy(self):
        cont = MyContainer()
        self.assertEqual(cont.dyntrait, 9.)
        ccont = copy.deepcopy(cont)
        self.assertEqual(ccont.dyntrait, 9.)
        cont.dyntrait = 12.
        ccont2 = copy.deepcopy(cont)
        self.assertEqual(ccont2.dyntrait, 12.)
        
    def test_add_bad_child(self):
        foo = Container()
        try:
            foo.add('non_container', 'some string')
        except TypeError, err:
            self.assertEqual(str(err), ": '<type 'str'>' "+
                "object is not an instance of Container.")
        else:
            self.fail('TypeError expected')
        
    def test_pathname(self):
        self.root.add('foo', Container())
        self.root.foo.add('foochild', Container())
        self.assertEqual(self.root.foo.foochild.get_pathname(), 'foo.foochild')

    def test_get(self):
        obj = self.root.get('c2.c21')
        self.assertEqual(obj.get_pathname(), 'c2.c21')
        num = self.root.get('c2.c22.c221.number')
        self.assertEqual(num, 3.14)

    def test_get_attribute(self):
        self.assertEqual(self.root.get('c2.c22.c221').trait('number').iotype, 
                         'in')
        
    def test_full_items(self):
        lst = map(lambda x: x[0], self.root.items(recurse=True))
        self.assertEqual(lst,
            ['c2', 'c2.c22', 'c2.c22.c221', 'c2.c22.c221.number', 'c2.c21', 'c1'])
        
        items = [(x[0],isinstance(x[1],Container) or str(x[1])) 
                    for x in self.root.items(recurse=True)]
        
        # values of True in the list below just indicate that the value
        # is a Container
        self.assertEqual(items, [('c2', True), 
                                 ('c2.c22', True), 
                                 ('c2.c22.c221', True), 
                                 ('c2.c22.c221.number', '3.14'), 
                                 ('c2.c21', True), 
                                 ('c1', True)])
        
    def test_default_naming(self):
        cont = Container()
        cont.add('container1', Container())
        cont.add('container2', Container())
        cc = Container()
        self.assertEqual(get_default_name(cc, cont), 'container3')
        
    def test_bad_get(self):
        try:
            x = self.root.bogus
        except AttributeError, err:
            self.assertEqual(str(err),"'Container' object has no attribute 'bogus'")
        else:
            self.fail('AttributeError expected')

    def test_iteration(self):
        names = [x.get_pathname() for n,x in self.root.items(recurse=True)
                                         if isinstance(x, Container)]
        self.assertEqual(sorted(names),
                         ['c1', 'c2', 'c2.c21', 
                          'c2.c22', 'c2.c22.c221'])
        
        names = [x.get_pathname() for n,x in self.root.items()
                                         if isinstance(x, Container)]
        self.assertEqual(sorted(names), ['c1', 'c2'])
        
        names = [x.get_pathname() for n,x in self.root.items(recurse=True)
                                 if isinstance(x, Container) and x.parent==self.root]
        self.assertEqual(sorted(names), ['c1', 'c2'])        

        names = [x.get_pathname() for n,x in self.root.items(recurse=True)
                                 if isinstance(x, Container) and x.parent==self.root.c2]
        self.assertEqual(sorted(names), ['c2.c21', 'c2.c22'])        

    # TODO: all of these save/load test functions need to do more checking
    #       to verify that the loaded thing is equivalent to the saved thing
    
    def test_save_load_yaml(self):
        output = StringIO.StringIO()
        c1 = Container()
        c1.add('c2', Container())
        c1.save(output, constants.SAVE_YAML)
        
        inp = StringIO.StringIO(output.getvalue())
        newc1 = Container.load(inp, constants.SAVE_YAML)
                
    def test_save_load_libyaml(self):
        output = StringIO.StringIO()
        c1 = Container()
        c1.add('c2', Container())
        c1.save(output, constants.SAVE_LIBYAML)
        
        inp = StringIO.StringIO(output.getvalue())
        newc1 = Container.load(inp, constants.SAVE_LIBYAML)
                
    def test_save_load_cpickle(self):
        output = StringIO.StringIO()
        c1 = Container()
        c1.add('c2', Container())
        c1.save(output)
        
        inp = StringIO.StringIO(output.getvalue())
        newc1 = Container.load(inp)
        
    def test_save_load_pickle(self):
        output = StringIO.StringIO()
        c1 = Container()
        c1.add('c2', Container())
        c1.save(output, constants.SAVE_PICKLE)
        
        inp = StringIO.StringIO(output.getvalue())
        newc1 = Container.load(inp, constants.SAVE_PICKLE)
                
    def test_save_bad_format(self):
        output = StringIO.StringIO()
        c1 = Container()
        try:
            c1.save(output, 'no-such-format')
        except RuntimeError, exc:
            msg = ": Can't save object using format 'no-such-format'"
            self.assertEqual(str(exc), msg)
        else:
            self.fail('Expected RuntimeError')

    def test_save_bad_filename(self):
# TODO: get make_protected_dir() to work on Windows.
        if sys.platform == 'win32':
            raise nose.SkipTest()

        c1 = Container()
        directory = make_protected_dir()
        path = os.path.join(directory, 'illegal')
        try:
            c1.save(path)
        except IOError, exc:
            msg = ": Can't save to '%s': Permission denied" % path
            self.assertEqual(str(exc), msg)
        else:
            self.fail('Expected IOError')
        finally:
            os.rmdir(directory)

    def test_save_bad_method(self):
        # This test exercises handling references to unbound methods defined
        # in __main__.  Because of this, it only does it's job if this is the
        # main module (not run as part of a larger suite in the buildout dir).
        output = StringIO.StringIO()
        c1 = Container()
        c1.unbound_thing = ContainerTestCase.test_save_bad_method
        try:
            c1.save(output)
        except RuntimeError, exc:
            msg = ": _pickle_method: <unbound method ContainerTestCase" \
                  ".test_save_bad_method> with module __main__ (None)"
            self.assertEqual(str(exc), msg)
        else:
            if MODULE_NAME == '__main__':
                self.fail('Expected RuntimeError')

    def test_load_bad_format(self):
        try:
            Container.load(StringIO.StringIO(''), 'no-such-format')
        except RuntimeError, exc:
            msg = "Can't load object using format 'no-such-format'"
            self.assertEqual(str(exc), msg)
        else:
            self.fail('Expected RuntimeError')

    def test_load_nofile(self):
        try:
            Container.load('no-such-file')
        except ValueError, exc:
            msg = "Bad state filename 'no-such-file'."
            self.assertEqual(str(exc), msg)
        else:
            self.fail('Expected ValueError')
            

if __name__ == "__main__":
    import nose
    import sys
    sys.argv.append('--cover-package=openmdao')
    sys.argv.append('--cover-erase')
    nose.runmodule()

